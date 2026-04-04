import { afterEach, beforeAll } from 'vitest';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import pg from 'pg';
import { execSync } from 'node:child_process';

dotenv.config();

type CleanupMode = 'truncate' | 'targeted';

type GlobalTestDbState = {
    readyPromise?: Promise<void>;
    ready?: boolean;
    db?: typeof import('../server/db')['db'];
};

const TEST_ID_PREFIXES = ['test-', 'debug-', 'hist-'];
const TEST_EMAIL_PATTERN = '%@restoflow.local';
const TEST_DB_SUFFIX = '_test';
const globalState = globalThis as typeof globalThis & {
    __restoflowTestDbState?: GlobalTestDbState;
};

const state = (globalState.__restoflowTestDbState ??= {});

const buildTestDatabaseUrl = (rawUrl: string) => {
    const parsed = new URL(rawUrl);
    const baseName = parsed.pathname.replace(/^\//, '') || 'restoflow_erp';
    parsed.pathname = `/${baseName.endsWith(TEST_DB_SUFFIX) ? baseName : `${baseName}${TEST_DB_SUFFIX}`}`;
    return parsed.toString();
};

const getDatabaseName = (rawUrl: string) => {
    try {
        return new URL(rawUrl).pathname.replace(/^\//, '');
    } catch {
        return '';
    }
};

const baseDatabaseUrl = process.env.TEST_DATABASE_URL || buildTestDatabaseUrl(process.env.DATABASE_URL || '');
const databaseName = getDatabaseName(baseDatabaseUrl);
const hasDedicatedTestDb = /(^|[-_])(test|e2e)([-_]|$)/i.test(databaseName);

if (hasDedicatedTestDb && baseDatabaseUrl) {
    process.env.DATABASE_URL = baseDatabaseUrl;
    process.env.DB_NAME = databaseName;
}

const ensureDatabaseExists = async (databaseUrl: string) => {
    const target = new URL(databaseUrl);
    const dbName = target.pathname.replace(/^\//, '');
    const adminUrl = new URL(databaseUrl);
    adminUrl.pathname = '/postgres';

    const adminPool = new pg.Pool({
        connectionString: adminUrl.toString(),
        max: 1,
    });

    try {
        const existing = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
        if (existing.rowCount === 0) {
            await adminPool.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
        }
    } finally {
        await adminPool.end();
    }
};

const pushSchemaToTestDatabase = (databaseUrl: string) => {
    execSync('npx drizzle-kit push --force', {
        cwd: process.cwd(),
        env: {
            ...process.env,
            DATABASE_URL: databaseUrl,
            DB_NAME: getDatabaseName(databaseUrl),
        },
        stdio: 'pipe',
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
    });
};

const ensureTestDatabaseReady = async () => {
    if (state.ready) return;
    if (!state.readyPromise) {
        state.readyPromise = (async () => {
            if (!baseDatabaseUrl || !hasDedicatedTestDb) {
                throw new Error(
                    `Dedicated test database URL could not be prepared. Current value: "${baseDatabaseUrl || 'missing'}".`,
                );
            }

            await ensureDatabaseExists(baseDatabaseUrl);
            pushSchemaToTestDatabase(baseDatabaseUrl);

            const serverDb = await import('../server/db');
            state.db = serverDb.db;
            state.ready = true;
        })();
    }

    await state.readyPromise;
};

const cleanupMode: CleanupMode = hasDedicatedTestDb ? 'truncate' : 'targeted';

const truncateTables = async () => {
    const db = state.db;
    if (!db) return;

    const tables = [
        'audit_logs',
        'order_payments',
        'order_items',
        'order_status_history',
        'orders',
        'stock_movements',
        'inventory_stock',
        'idempotency_keys',
        'user_sessions',
        'menu_items',
        'menu_categories',
        'warehouses',
        'shifts',
        'users',
        'branches',
    ];

    for (const table of tables) {
        try {
            await db.execute(sql.raw(`TRUNCATE TABLE ${table} CASCADE;`));
        } catch {
            // Ignore missing tables in partially-migrated environments.
        }
    }
};

const deleteByPrefixes = async (table: string, column: string) => {
    const db = state.db;
    if (!db) return;

    const conditions = TEST_ID_PREFIXES
        .map((prefix) => `${column} LIKE '${prefix}%'`)
        .join(' OR ');
    if (!conditions) return;
    await db.execute(sql.raw(`DELETE FROM ${table} WHERE ${conditions};`));
};

const targetedCleanup = async () => {
    const db = state.db;
    if (!db) return;

    await db.execute(sql.raw(`
        DELETE FROM order_payments
        WHERE order_id IN (
            SELECT id FROM orders
            WHERE branch_id LIKE 'test-%' OR branch_id LIKE 'debug-%' OR branch_id LIKE 'hist-%'
        );
    `)).catch(() => undefined);

    await db.execute(sql.raw(`
        DELETE FROM order_items
        WHERE order_id IN (
            SELECT id FROM orders
            WHERE branch_id LIKE 'test-%' OR branch_id LIKE 'debug-%' OR branch_id LIKE 'hist-%'
        );
    `)).catch(() => undefined);

    await db.execute(sql.raw(`
        DELETE FROM order_status_history
        WHERE order_id IN (
            SELECT id FROM orders
            WHERE branch_id LIKE 'test-%' OR branch_id LIKE 'debug-%' OR branch_id LIKE 'hist-%'
        );
    `)).catch(() => undefined);

    await db.execute(sql.raw(`
        DELETE FROM orders
        WHERE branch_id LIKE 'test-%' OR branch_id LIKE 'debug-%' OR branch_id LIKE 'hist-%';
    `)).catch(() => undefined);

    await db.execute(sql.raw(`
        DELETE FROM user_sessions
        WHERE user_id IN (
            SELECT id FROM users
            WHERE email LIKE '${TEST_EMAIL_PATTERN}'
        );
    `)).catch(() => undefined);

    await deleteByPrefixes('idempotency_keys', 'key').catch(() => undefined);
    await deleteByPrefixes('menu_items', 'id').catch(() => undefined);
    await deleteByPrefixes('menu_categories', 'id').catch(() => undefined);
    await deleteByPrefixes('warehouses', 'id').catch(() => undefined);
    await deleteByPrefixes('shifts', 'id').catch(() => undefined);
    await deleteByPrefixes('branches', 'id').catch(() => undefined);

    await db.execute(sql.raw(`
        DELETE FROM users
        WHERE email LIKE '${TEST_EMAIL_PATTERN}'
           OR id LIKE 'test-%'
           OR id LIKE 'debug-%'
           OR id LIKE 'hist-%';
    `)).catch(() => undefined);
};

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await ensureTestDatabaseReady();

    if (!state.db) {
        console.error('Failed to initialize dedicated test database.');
        process.exit(1);
    }

    try {
        await state.db.execute(sql`SELECT 1`);
    } catch (error) {
        console.error('Failed to connect to test database:', error);
        process.exit(1);
    }

    if (cleanupMode === 'targeted') {
        console.warn(
            `[tests/setup] Running in targeted cleanup mode for database "${databaseName || 'unknown'}". ` +
            'Set TEST_ALLOW_DB_TRUNCATE=true or use a dedicated test DB name containing "test" or "e2e" for full truncation.',
        );
    }
});

afterEach(async () => {
    if (cleanupMode === 'truncate') {
        await truncateTables();
        return;
    }

    await targetedCleanup();
});
