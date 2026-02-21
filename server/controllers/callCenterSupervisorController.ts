import { Request, Response } from 'express';
import { db } from '../db';
import { orders, settings } from '../../src/db/schema';
import { and, eq, gte, lt, lte, or } from 'drizzle-orm';

type EscalationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type EscalationStatus = 'OPEN' | 'RESOLVED';

type EscalationRecord = {
    id: string;
    orderId: string;
    branchId?: string | null;
    status: EscalationStatus;
    priority: EscalationPriority;
    reason: string;
    notes?: string | null;
    createdBy?: string | null;
    createdAt: string;
    assignedTo?: string | null;
    resolvedBy?: string | null;
    resolvedAt?: string | null;
    resolutionNotes?: string | null;
};

const SETTINGS_KEY = 'callCenterEscalations';
const COACHING_SETTINGS_KEY = 'callCenterCoachingNotes';
const DISCOUNT_APPROVALS_KEY = 'callCenterDiscountApprovals';

type CoachingNoteRecord = {
    id: string;
    agentId: string;
    branchId?: string | null;
    note: string;
    tags?: string[];
    createdBy?: string | null;
    createdAt: string;
};

type DiscountApprovalRecord = {
    id: string;
    orderId: string;
    agentId?: string | null;
    branchId?: string | null;
    status: 'APPROVED' | 'REJECTED';
    reason?: string | null;
    approvedBy?: string | null;
    approvedAt: string;
};

const isPriority = (value: string): value is EscalationPriority =>
    ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(value);

const loadEscalations = async (): Promise<EscalationRecord[]> => {
    const [row] = await db.select().from(settings).where(eq(settings.key, SETTINGS_KEY)).limit(1);
    const raw = row?.value;
    if (!Array.isArray(raw)) return [];
    return raw as EscalationRecord[];
};

const saveEscalations = async (records: EscalationRecord[], userId?: string | null) => {
    await db
        .insert(settings)
        .values({
            key: SETTINGS_KEY,
            value: records,
            category: 'call_center',
            updatedBy: userId || 'system',
            updatedAt: new Date(),
        })
        .onConflictDoUpdate({
            target: settings.key,
            set: {
                value: records,
                category: 'call_center',
                updatedBy: userId || 'system',
                updatedAt: new Date(),
            },
        });
};

const loadCoachingNotes = async (): Promise<CoachingNoteRecord[]> => {
    const [row] = await db.select().from(settings).where(eq(settings.key, COACHING_SETTINGS_KEY)).limit(1);
    const raw = row?.value;
    if (!Array.isArray(raw)) return [];
    return raw as CoachingNoteRecord[];
};

const saveCoachingNotes = async (records: CoachingNoteRecord[], userId?: string | null) => {
    await db
        .insert(settings)
        .values({
            key: COACHING_SETTINGS_KEY,
            value: records,
            category: 'call_center',
            updatedBy: userId || 'system',
            updatedAt: new Date(),
        })
        .onConflictDoUpdate({
            target: settings.key,
            set: {
                value: records,
                category: 'call_center',
                updatedBy: userId || 'system',
                updatedAt: new Date(),
            },
        });
};

const loadDiscountApprovals = async (): Promise<DiscountApprovalRecord[]> => {
    const [row] = await db.select().from(settings).where(eq(settings.key, DISCOUNT_APPROVALS_KEY)).limit(1);
    const raw = row?.value;
    if (!Array.isArray(raw)) return [];
    return raw as DiscountApprovalRecord[];
};

const saveDiscountApprovals = async (records: DiscountApprovalRecord[], userId?: string | null) => {
    await db
        .insert(settings)
        .values({
            key: DISCOUNT_APPROVALS_KEY,
            value: records,
            category: 'call_center',
            updatedBy: userId || 'system',
            updatedAt: new Date(),
        })
        .onConflictDoUpdate({
            target: settings.key,
            set: {
                value: records,
                category: 'call_center',
                updatedBy: userId || 'system',
                updatedAt: new Date(),
            },
        });
};

export const getEscalations = async (req: Request, res: Response) => {
    try {
        const statusFilter = String(req.query.status || '').toUpperCase();
        const branchId = String(req.query.branchId || '');
        const records = await loadEscalations();
        const filtered = records.filter((item) => {
            if (statusFilter && item.status !== statusFilter) return false;
            if (branchId && String(item.branchId || '') !== branchId) return false;
            return true;
        });
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json(filtered);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'FAILED_TO_LOAD_ESCALATIONS' });
    }
};

export const createEscalation = async (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        const orderId = String(body.orderId || '').trim();
        const reason = String(body.reason || '').trim();
        const priorityRaw = String(body.priority || 'HIGH').toUpperCase();
        const priority: EscalationPriority = isPriority(priorityRaw) ? priorityRaw : 'HIGH';

        if (!orderId) return res.status(400).json({ error: 'ORDER_ID_REQUIRED' });
        if (!reason) return res.status(400).json({ error: 'ESCALATION_REASON_REQUIRED' });

        const current = await loadEscalations();
        const existingOpen = current.find((e) => e.orderId === orderId && e.status === 'OPEN');
        if (existingOpen) {
            return res.status(409).json({ error: 'ESCALATION_ALREADY_OPEN', escalation: existingOpen });
        }

        const userId = req.user?.id || null;
        const nowIso = new Date().toISOString();
        const newItem: EscalationRecord = {
            id: `esc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            orderId,
            branchId: body.branchId || req.user?.branchId || null,
            status: 'OPEN',
            priority,
            reason,
            notes: body.notes ? String(body.notes) : null,
            createdBy: userId,
            createdAt: nowIso,
            assignedTo: body.assignedTo ? String(body.assignedTo) : null,
        };

        const next = [newItem, ...current];
        await saveEscalations(next, userId);
        res.status(201).json(newItem);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'FAILED_TO_CREATE_ESCALATION' });
    }
};

export const resolveEscalation = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id || '').trim();
        if (!id) return res.status(400).json({ error: 'ESCALATION_ID_REQUIRED' });

        const resolutionNotes = String(req.body?.resolutionNotes || '').trim();
        const userId = req.user?.id || null;

        const current = await loadEscalations();
        const index = current.findIndex((e) => e.id === id);
        if (index === -1) return res.status(404).json({ error: 'ESCALATION_NOT_FOUND' });

        const target = current[index];
        if (target.status === 'RESOLVED') return res.json(target);

        const resolved: EscalationRecord = {
            ...target,
            status: 'RESOLVED',
            resolvedBy: userId,
            resolvedAt: new Date().toISOString(),
            resolutionNotes: resolutionNotes || null,
        };

        current[index] = resolved;
        await saveEscalations(current, userId);
        res.json(resolved);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'FAILED_TO_RESOLVE_ESCALATION' });
    }
};

export const autoScanEscalations = async (req: Request, res: Response) => {
    try {
        const thresholdMinutes = Math.max(5, Number(req.body?.thresholdMinutes || 20));
        const branchId = String(req.body?.branchId || req.user?.branchId || '').trim();
        const cutoff = new Date(Date.now() - thresholdMinutes * 60 * 1000);
        const userId = req.user?.id || null;

        const orderConditions: any[] = [
            or(eq(orders.isCallCenterOrder, true), eq(orders.source, 'call_center')),
            or(eq(orders.status, 'PENDING'), eq(orders.status, 'PREPARING'), eq(orders.status, 'READY')),
            lt(orders.createdAt, cutoff),
        ];
        if (branchId) orderConditions.push(eq(orders.branchId, branchId));

        const staleOrders = await db.select({
            id: orders.id,
            branchId: orders.branchId,
            createdAt: orders.createdAt,
        }).from(orders).where(and(...orderConditions));

        const current = await loadEscalations();
        const openOrderIds = new Set(current.filter((e) => e.status === 'OPEN').map((e) => e.orderId));
        const nowIso = new Date().toISOString();
        const additions: EscalationRecord[] = [];

        for (const order of staleOrders) {
            if (openOrderIds.has(order.id)) continue;
            const ageMinutes = Math.floor((Date.now() - new Date(order.createdAt || nowIso).getTime()) / 60000);
            const priority: EscalationPriority = ageMinutes >= 45 ? 'CRITICAL' : ageMinutes >= 30 ? 'HIGH' : 'MEDIUM';
            additions.push({
                id: `esc-auto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                orderId: order.id,
                branchId: order.branchId || null,
                status: 'OPEN',
                priority,
                reason: ageMinutes >= 45 ? 'SLA_BREACH_AUTO' : 'SLA_RISK_AUTO',
                notes: `Auto scan detected stale order (${ageMinutes}m)`,
                createdBy: userId || 'system',
                createdAt: nowIso,
                assignedTo: null,
            });
        }

        if (additions.length > 0) {
            await saveEscalations([...additions, ...current], userId);
        }

        res.json({
            scanned: staleOrders.length,
            created: additions.length,
            thresholdMinutes,
            branchId: branchId || 'ALL',
            escalations: additions,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'FAILED_TO_SCAN_ESCALATIONS' });
    }
};

export const getCoachingNotes = async (req: Request, res: Response) => {
    try {
        const agentId = String(req.query.agentId || '').trim();
        const branchId = String(req.query.branchId || '').trim();
        const records = await loadCoachingNotes();
        const filtered = records.filter((item) => {
            if (agentId && item.agentId !== agentId) return false;
            if (branchId && String(item.branchId || '') !== branchId) return false;
            return true;
        });
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json(filtered);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'FAILED_TO_LOAD_COACHING_NOTES' });
    }
};

export const addCoachingNote = async (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        const agentId = String(body.agentId || '').trim();
        const note = String(body.note || '').trim();
        if (!agentId) return res.status(400).json({ error: 'AGENT_ID_REQUIRED' });
        if (!note) return res.status(400).json({ error: 'COACHING_NOTE_REQUIRED' });

        const tags = Array.isArray(body.tags)
            ? body.tags.map((t: any) => String(t || '').trim()).filter(Boolean)
            : [];
        const userId = req.user?.id || null;
        const nowIso = new Date().toISOString();
        const newItem: CoachingNoteRecord = {
            id: `coach-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            agentId,
            branchId: body.branchId || req.user?.branchId || null,
            note,
            tags,
            createdBy: userId,
            createdAt: nowIso,
        };

        const current = await loadCoachingNotes();
        const next = [newItem, ...current].slice(0, 3000);
        await saveCoachingNotes(next, userId);
        res.status(201).json(newItem);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'FAILED_TO_ADD_COACHING_NOTE' });
    }
};

export const getDiscountAbuse = async (req: Request, res: Response) => {
    try {
        const branchId = String(req.query.branchId || '').trim();
        const startDateRaw = String(req.query.startDate || '').trim();
        const endDateRaw = String(req.query.endDate || '').trim();
        const thresholdPercent = Math.max(5, Number(req.query.thresholdPercent || 20));
        const thresholdAmount = Math.max(1, Number(req.query.thresholdAmount || 120));

        const end = endDateRaw ? new Date(`${endDateRaw}T23:59:59.999`) : new Date();
        const start = startDateRaw ? new Date(`${startDateRaw}T00:00:00.000`) : new Date(end);
        if (!startDateRaw) start.setDate(end.getDate() - 7);

        const conditions: any[] = [
            or(eq(orders.isCallCenterOrder, true), eq(orders.source, 'call_center')),
            gte(orders.createdAt, start),
            lte(orders.createdAt, end),
        ];
        if (branchId) conditions.push(eq(orders.branchId, branchId));

        const scopedOrders = await db.select({
            id: orders.id,
            branchId: orders.branchId,
            callCenterAgentId: orders.callCenterAgentId,
            status: orders.status,
            subtotal: orders.subtotal,
            discount: orders.discount,
            total: orders.total,
            createdAt: orders.createdAt,
        }).from(orders).where(and(...conditions));

        const approvals = await loadDiscountApprovals();
        const approvedOrderIds = new Set(
            approvals
                .filter((a) => a.status === 'APPROVED')
                .map((a) => a.orderId),
        );

        const violations = scopedOrders
            .map((order) => {
                const subtotal = Math.max(0, Number(order.subtotal || 0));
                const discount = Math.max(0, Number(order.discount || 0));
                const discountPercent = subtotal > 0 ? (discount / subtotal) * 100 : 0;
                const highDiscount = discountPercent >= thresholdPercent || discount >= thresholdAmount;
                return {
                    orderId: order.id,
                    branchId: order.branchId || null,
                    agentId: order.callCenterAgentId || null,
                    status: String(order.status || ''),
                    subtotal,
                    discount,
                    total: Number(order.total || 0),
                    discountPercent: Number(discountPercent.toFixed(2)),
                    createdAt: order.createdAt,
                    highDiscount,
                    approved: approvedOrderIds.has(order.id),
                };
            })
            .filter((v) => v.highDiscount)
            .sort((a, b) => Number(b.discountPercent) - Number(a.discountPercent));

        const pendingViolations = violations.filter((v) => !v.approved);

        const byAgent = new Map<string, { agentId: string; orders: number; discountTotal: number; highDiscountOrders: number }>();
        for (const order of scopedOrders) {
            const agentId = String(order.callCenterAgentId || 'UNASSIGNED');
            const row = byAgent.get(agentId) || { agentId, orders: 0, discountTotal: 0, highDiscountOrders: 0 };
            const subtotal = Math.max(0, Number(order.subtotal || 0));
            const discount = Math.max(0, Number(order.discount || 0));
            const discountPercent = subtotal > 0 ? (discount / subtotal) * 100 : 0;
            row.orders += 1;
            row.discountTotal += discount;
            if (discountPercent >= thresholdPercent || discount >= thresholdAmount) row.highDiscountOrders += 1;
            byAgent.set(agentId, row);
        }

        res.json({
            branchId: branchId || 'ALL',
            period: { start, end },
            thresholds: { thresholdPercent, thresholdAmount },
            totalOrders: scopedOrders.length,
            violations: pendingViolations,
            approvedViolations: violations.filter((v) => v.approved),
            byAgent: Array.from(byAgent.values()).sort((a, b) => b.highDiscountOrders - a.highDiscountOrders),
            approvals: approvals.filter((a) => !branchId || String(a.branchId || '') === branchId),
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'FAILED_TO_LOAD_DISCOUNT_ABUSE' });
    }
};

export const approveDiscountViolation = async (req: Request, res: Response) => {
    try {
        const orderId = String(req.body?.orderId || '').trim();
        const agentId = String(req.body?.agentId || '').trim();
        const branchId = String(req.body?.branchId || req.user?.branchId || '').trim();
        const status = String(req.body?.status || 'APPROVED').toUpperCase() === 'REJECTED' ? 'REJECTED' : 'APPROVED';
        const reason = String(req.body?.reason || '').trim();
        if (!orderId) return res.status(400).json({ error: 'ORDER_ID_REQUIRED' });

        const userId = req.user?.id || null;
        const nowIso = new Date().toISOString();
        const current = await loadDiscountApprovals();
        const existingIndex = current.findIndex((item) => item.orderId === orderId);
        const record: DiscountApprovalRecord = {
            id: existingIndex >= 0 ? current[existingIndex].id : `disc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            orderId,
            agentId: agentId || null,
            branchId: branchId || null,
            status,
            reason: reason || null,
            approvedBy: userId,
            approvedAt: nowIso,
        };

        if (existingIndex >= 0) {
            current[existingIndex] = record;
        } else {
            current.unshift(record);
        }
        await saveDiscountApprovals(current.slice(0, 5000), userId);
        res.json(record);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'FAILED_TO_APPROVE_DISCOUNT_VIOLATION' });
    }
};
