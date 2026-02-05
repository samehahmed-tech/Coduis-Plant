import { Request, Response } from 'express';
import { db } from '../db';
import { auditLogs } from '../../src/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const { event_type, user_id, limit } = req.query;
        const max = Math.min(Number(limit) || 200, 500);

        const conditions = [];
        if (event_type) conditions.push(eq(auditLogs.eventType, event_type as string));
        if (user_id) conditions.push(eq(auditLogs.userId, user_id as string));

        const query = db.select().from(auditLogs);
        const results = conditions.length
            ? await query.where(and(...conditions)).orderBy(desc(auditLogs.createdAt)).limit(max)
            : await query.orderBy(desc(auditLogs.createdAt)).limit(max);

        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createAuditLog = async (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        const payload = body.payload;
        const before = body.before ?? payload?.before;
        const after = body.after ?? payload?.after ?? payload?.order ?? payload;
        const reason = body.reason ?? payload?.reason;

        const [created] = await db.insert(auditLogs).values({
            eventType: body.eventType || body.event_type,
            userId: body.userId || body.user_id,
            userName: body.userName || body.user_name,
            userRole: body.userRole || body.user_role,
            branchId: body.branchId || body.branch_id,
            deviceId: body.deviceId || body.device_id,
            ipAddress: body.ipAddress || body.ip_address,
            payload: payload,
            before,
            after,
            reason,
            signature: body.signature,
            createdAt: new Date(),
        }).returning();

        res.status(201).json(created);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
