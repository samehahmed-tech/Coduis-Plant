import { Request, Response } from 'express';
import { pool } from '../db';
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
