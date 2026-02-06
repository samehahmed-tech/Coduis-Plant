import { Request, Response } from 'express';
import { db } from '../db';
import { auditLogs } from '../../src/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import crypto from 'crypto';
import { requireEnv } from '../config/env';

function stableStringify(value: any): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    const keys = Object.keys(value).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

function computeAuditSignature(input: {
    eventType: string;
    userId?: string | null;
    branchId?: string | null;
    deviceId?: string | null;
    payload?: any;
    before?: any;
    after?: any;
    reason?: string | null;
    createdAt: Date;
}): string {
    const secret = requireEnv('AUDIT_HMAC_SECRET');
    const toSign = stableStringify({
        eventType: input.eventType,
        userId: input.userId ?? null,
        branchId: input.branchId ?? null,
        deviceId: input.deviceId ?? null,
        payload: input.payload ?? null,
        before: input.before ?? null,
        after: input.after ?? null,
        reason: input.reason ?? null,
        createdAt: input.createdAt.toISOString(),
    });

    return crypto.createHmac('sha256', secret).update(toSign).digest('hex');
}

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const event_type = typeof req.query.event_type === 'string' ? req.query.event_type : undefined;
        const user_id = typeof req.query.user_id === 'string' ? req.query.user_id : undefined;
        const limit = typeof req.query.limit === 'string' ? req.query.limit : undefined;

        const max = Math.min(Number(limit) || 200, 500);

        const conditions: any[] = [];
        if (event_type) conditions.push(eq(auditLogs.eventType, event_type));
        if (user_id) conditions.push(eq(auditLogs.userId, user_id));

        const query = db.select().from(auditLogs);
        const results = (conditions.length
            ? await query.where(and(...conditions)).orderBy(desc(auditLogs.createdAt)).limit(max)
            : await query.orderBy(desc(auditLogs.createdAt)).limit(max)) as any[];

        // Attach integrity check from server-side secret (never sent to client).
        const withIntegrity = results.map((row) => {
            const createdAt = row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
            const expected = computeAuditSignature({
                eventType: row.eventType,
                userId: row.userId,
                branchId: row.branchId,
                deviceId: row.deviceId,
                payload: row.payload,
                before: row.before,
                after: row.after,
                reason: row.reason,
                createdAt,
            });
            return {
                ...row,
                signatureValid: row.signature ? row.signature === expected : undefined,
            };
        });

        res.json(withIntegrity);
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
        const createdAtCandidate = body.createdAt ?? body.created_at ?? body.timestamp;
        const createdAt = createdAtCandidate ? new Date(createdAtCandidate) : new Date();

        const signature = computeAuditSignature({
            eventType: body.eventType || body.event_type,
            userId: body.userId || body.user_id,
            branchId: body.branchId || body.branch_id,
            deviceId: body.deviceId || body.device_id,
            payload,
            before,
            after,
            reason,
            createdAt: isNaN(createdAt.getTime()) ? new Date() : createdAt,
        });

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
            signature,
            createdAt: isNaN(createdAt.getTime()) ? new Date() : createdAt,
        }).returning();

        res.status(201).json({ ...created, signatureValid: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
