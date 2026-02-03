
import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function listAllTables() {
    try {
        const result = await db.execute(sql`SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog')`);
        console.log('--- All Tables ---');
        console.table(result.rows);
        process.exit(0);
    } catch (error) {
        console.error('Error listing all tables:', error);
        process.exit(1);
    }
}

listAllTables();
