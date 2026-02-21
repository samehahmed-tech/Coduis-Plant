import { Request, Response } from 'express';
import { pool } from '../db';
import { db } from '../db';
import { etaDeadLetters, fiscalLogs } from '../../src/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import { getStringParam } from '../utils/request';
import { getSocketRuntimeStatus } from '../socket';

export const getRealtimeHealth = async (_req: Request, res: Response) => {
    const socket = getSocketRuntimeStatus();
    let dbOk = false;
    let dbLatencyMs = -1;

    try {
        const started = Date.now();
        await pool.query('select 1');
        dbOk = true;
        dbLatencyMs = Date.now() - started;
    } catch {
        dbOk = false;
    }

    res.json({
        ok: dbOk,
        timestamp: new Date().toISOString(),
        database: {
            ok: dbOk,
            latencyMs: dbLatencyMs,
        },
        socket,
    });
};

export const getPlatformHealth = async (req: Request, res: Response) => {
    const socket = getSocketRuntimeStatus();
    const branchId = getStringParam(req.query.branchId);
    const startedAt = Date.now();
    let dbOk = false;
    let dbLatencyMs = -1;

    try {
        const dbStarted = Date.now();
        await pool.query('select 1');
        dbOk = true;
        dbLatencyMs = Date.now() - dbStarted;
    } catch {
        dbOk = false;
    }

    const since = new Date();
    since.setDate(since.getDate() - 1);

    const rows = await db.select({
        status: fiscalLogs.status,
        count: sql<number>`count(*)`,
    }).from(fiscalLogs)
        .where(and(
            branchId ? eq(fiscalLogs.branchId, branchId) : undefined,
            gte(fiscalLogs.createdAt, since),
        ))
        .groupBy(fiscalLogs.status);

    const pendingDlqRows = await db.select({ count: sql<number>`count(*)` }).from(etaDeadLetters)
        .where(and(
            branchId ? eq(etaDeadLetters.branchId, branchId) : undefined,
            eq(etaDeadLetters.status, 'PENDING'),
        ));

    const submitted = Number(rows.find(r => r.status === 'SUBMITTED')?.count || 0);
    const failed = Number(rows.find(r => r.status === 'FAILED')?.count || 0);
    const pending = Number(rows.find(r => r.status === 'PENDING')?.count || 0);
    const total = submitted + failed + pending;
    const successRate = total > 0 ? Number((submitted / total).toFixed(4)) : 1;
    const pendingDlqCount = Number(pendingDlqRows[0]?.count || 0);

    const fiscalConfigMissing = [
        'ETA_BASE_URL',
        'ETA_TOKEN_URL',
        'ETA_CLIENT_ID',
        'ETA_CLIENT_SECRET',
        'ETA_API_KEY',
        'ETA_PRIVATE_KEY',
        'ETA_RIN',
    ].filter((key) => !process.env[key]);

    const alerts = {
        dbDown: !dbOk,
        realtimeDegraded: socket.adapter !== 'redis' || !socket.redisConnected,
        fiscalConfigMissing: fiscalConfigMissing.length > 0,
        fiscalLowSuccessRate: successRate < 0.98,
        fiscalPendingDlq: pendingDlqCount > 0,
    };

    res.json({
        ok: !alerts.dbDown && !alerts.fiscalConfigMissing,
        timestamp: new Date().toISOString(),
        responseTimeMs: Date.now() - startedAt,
        branchScope: branchId || 'ALL',
        database: {
            ok: dbOk,
            latencyMs: dbLatencyMs,
        },
        socket,
        fiscal: {
            configOk: fiscalConfigMissing.length === 0,
            missingConfig: fiscalConfigMissing,
            metrics24h: {
                submitted,
                pending,
                failed,
                total,
                successRate,
            },
            deadLetter: {
                pendingCount: pendingDlqCount,
            },
        },
        alerts,
    });
};
