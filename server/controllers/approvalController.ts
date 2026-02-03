import { Request, Response } from 'express';
import { db } from '../db';
import { managerApprovals, auditLogs, users } from '../../src/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export const createApproval = async (req: Request, res: Response) => {
    try {
        const { managerId, branchId, actionType, relatedId, reason, details } = req.body;

        const [approval] = await db.insert(managerApprovals).values({
            managerId,
            branchId,
            actionType,
            relatedId,
            reason,
            details,
            createdAt: new Date(),
        }).returning();

        // Also log to audit logs for central visibility
        await db.insert(auditLogs).values({
            eventType: `MANAGER_APPROVAL_${actionType}`,
            userId: managerId,
            branchId,
            reason,
            payload: details,
            createdAt: new Date(),
        });

        res.status(201).json(approval);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getApprovals = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.query;
        let query = db.select().from(managerApprovals);

        if (branchId) {
            // @ts-ignore
            query = query.where(eq(managerApprovals.branchId, branchId as string));
        }

        const approvals = await query.orderBy(desc(managerApprovals.createdAt)).limit(100);
        res.json(approvals);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Verify Manager PIN for secure actions (Void, Refund, High Discount)
 */
export const verifyManagerPin = async (req: Request, res: Response) => {
    try {
        const { branchId, pin, action } = req.body;

        if (!pin || !branchId || !action) {
            return res.status(400).json({ error: 'branchId, pin, and action are required' });
        }

        // Find managers in this branch with matching PIN
        const managers = await db.select({
            id: users.id,
            name: users.name,
            role: users.role
        }).from(users).where(
            and(
                eq(users.assignedBranchId, branchId),
                eq(users.managerPin, pin),
                eq(users.isActive, true)
            )
        );

        // Check if any matching user has manager-level role
        const validManager = managers.find(m =>
            ['SUPER_ADMIN', 'BRANCH_MANAGER', 'MANAGER'].includes(m.role)
        );

        if (validManager) {
            // Log the approval
            await db.insert(managerApprovals).values({
                managerId: validManager.id,
                branchId,
                actionType: action,
                reason: 'PIN Verified',
                createdAt: new Date(),
            });

            res.json({
                approved: true,
                managerId: validManager.id,
                managerName: validManager.name
            });
        } else {
            res.json({ approved: false, error: 'Invalid PIN or insufficient permissions' });
        }
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
