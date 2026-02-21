import crypto from 'crypto';
import { pool } from '../db';

export type PrintQueueStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface EnqueuePrintJobInput {
    branchId: string;
    type: 'RECEIPT' | 'KITCHEN';
    content: string;
    printerId?: string | null;
    printerAddress?: string | null;
    printerType?: 'LOCAL' | 'NETWORK' | null;
    createdBy?: string | null;
    maxAttempts?: number;
}

let ensured = false;

const ensureTable = async () => {
    if (ensured) return;
    await pool.query(`
        create table if not exists print_jobs (
            id text primary key,
            branch_id text not null,
            type text not null,
            content text not null,
            printer_id text,
            printer_address text,
            printer_type text default 'LOCAL',
            status text not null default 'QUEUED',
            attempts integer not null default 0,
            max_attempts integer not null default 3,
            created_by text,
            claimed_by text,
            claimed_at timestamp,
            completed_at timestamp,
            last_error text,
            created_at timestamp not null default now(),
            updated_at timestamp not null default now()
        );
        create index if not exists print_jobs_branch_status_created_idx on print_jobs(branch_id, status, created_at);
    `);
    ensured = true;
};

export const enqueuePrintJob = async (input: EnqueuePrintJobInput) => {
    await ensureTable();
    const id = `PRNJOB-${crypto.randomUUID()}`;
    const values = [
        id,
        input.branchId,
        input.type,
        input.content,
        input.printerId || null,
        input.printerAddress || null,
        input.printerType || 'LOCAL',
        'QUEUED',
        0,
        Math.max(1, Number(input.maxAttempts || 3)),
        input.createdBy || null,
    ];
    const { rows } = await pool.query(
        `insert into print_jobs
        (id, branch_id, type, content, printer_id, printer_address, printer_type, status, attempts, max_attempts, created_by)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        returning *`,
        values,
    );
    return rows[0];
};

export const claimNextPrintJob = async (params: { branchId: string; gatewayId: string }) => {
    await ensureTable();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(
            `select * from print_jobs
             where branch_id = $1 and status = 'QUEUED'
             order by created_at asc
             limit 1
             for update skip locked`,
            [params.branchId],
        );
        const next = rows[0];
        if (!next) {
            await client.query('COMMIT');
            return null;
        }
        const { rows: updatedRows } = await client.query(
            `update print_jobs
             set status = 'PROCESSING', claimed_by = $2, claimed_at = now(), updated_at = now()
             where id = $1
             returning *`,
            [next.id, params.gatewayId],
        );
        await client.query('COMMIT');
        return updatedRows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const completePrintJob = async (jobId: string, gatewayId: string) => {
    await ensureTable();
    const { rows } = await pool.query(
        `update print_jobs
         set status = 'COMPLETED', completed_at = now(), updated_at = now()
         where id = $1 and claimed_by = $2
         returning *`,
        [jobId, gatewayId],
    );
    return rows[0] || null;
};

export const failPrintJob = async (params: { jobId: string; gatewayId: string; error: string }) => {
    await ensureTable();
    const { rows } = await pool.query(
        `update print_jobs
         set attempts = attempts + 1,
             status = case when attempts + 1 >= max_attempts then 'FAILED' else 'QUEUED' end,
             last_error = $3,
             updated_at = now()
         where id = $1 and claimed_by = $2
         returning *`,
        [params.jobId, params.gatewayId, params.error.slice(0, 1000)],
    );
    return rows[0] || null;
};

export const listPrintJobs = async (params: {
    branchId?: string;
    status?: PrintQueueStatus;
    limit?: number;
}) => {
    await ensureTable();
    const clauses: string[] = [];
    const values: any[] = [];
    if (params.branchId) {
        values.push(params.branchId);
        clauses.push(`branch_id = $${values.length}`);
    }
    if (params.status) {
        values.push(params.status);
        clauses.push(`status = $${values.length}`);
    }
    const where = clauses.length ? `where ${clauses.join(' and ')}` : '';
    const limit = Math.min(500, Math.max(1, Number(params.limit || 100)));
    values.push(limit);
    const { rows } = await pool.query(
        `select * from print_jobs ${where} order by created_at desc limit $${values.length}`,
        values,
    );
    return rows;
};

export const getPrintQueueStats = async (branchId?: string) => {
    await ensureTable();
    const values: any[] = [];
    const scope = branchId ? `where branch_id = $1` : '';
    if (branchId) values.push(branchId);
    const { rows } = await pool.query(
        `select status, count(*)::int as count from print_jobs ${scope} group by status`,
        values,
    );
    const stats = { queued: 0, processing: 0, completed: 0, failed: 0, total: 0 };
    for (const row of rows) {
        const count = Number(row.count || 0);
        const status = String(row.status || '').toUpperCase();
        if (status === 'QUEUED') stats.queued = count;
        if (status === 'PROCESSING') stats.processing = count;
        if (status === 'COMPLETED') stats.completed = count;
        if (status === 'FAILED') stats.failed = count;
        stats.total += count;
    }
    return stats;
};

export const retryPrintJob = async (jobId: string) => {
    await ensureTable();
    const { rows } = await pool.query(
        `update print_jobs
         set status = 'QUEUED',
             claimed_by = null,
             claimed_at = null,
             completed_at = null,
             last_error = null,
             updated_at = now()
         where id = $1 and status = 'FAILED'
         returning *`,
        [jobId],
    );
    return rows[0] || null;
};
