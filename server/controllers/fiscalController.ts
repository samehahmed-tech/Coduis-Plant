import { Request, Response } from 'express';
import { db } from '../db';
import { fiscalLogs } from '../../src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getStringParam, getNumberParam } from '../utils/request';
import { submitOrderToFiscal } from '../services/fiscalSubmitService';

export const submitReceipt = async (req: Request, res: Response) => {
    try {
        const orderId = getStringParam(req.body?.orderId);
        if (!orderId) return res.status(400).json({ error: 'ORDER_ID_REQUIRED' });
        const force = Boolean(req.body?.force);
        const result = await submitOrderToFiscal(orderId, { force });
        res.json({ success: true, ...result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getFiscalLogs = async (req: Request, res: Response) => {
    try {
        const branchId = getStringParam(req.query.branchId);
        const limit = getNumberParam(req.query.limit) || 50;

        let query = db.select().from(fiscalLogs);
        if (branchId) {
            // @ts-ignore
            query = query.where(eq(fiscalLogs.branchId, branchId));
        }
        const rows = await query.orderBy(desc(fiscalLogs.createdAt)).limit(Math.min(200, limit));
        res.json(rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getFiscalConfig = async (_req: Request, res: Response) => {
    const required = [
        'ETA_BASE_URL',
        'ETA_TOKEN_URL',
        'ETA_CLIENT_ID',
        'ETA_CLIENT_SECRET',
        'ETA_API_KEY',
        'ETA_PRIVATE_KEY',
        'ETA_RIN',
    ];
    const missing = required.filter(key => !process.env[key]);
    res.json({ ok: missing.length === 0, missing });
};
