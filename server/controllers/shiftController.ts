import { Request, Response } from 'express';
import { db } from '../db';
import { shifts, orders, payments } from '../../src/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const openShift = async (req: Request, res: Response) => {
    try {
        const { id, branchId, userId, openingBalance, notes } = req.body;

        // Check if branch already has an open shift
        const existingOpenShift = await db.select().from(shifts).where(
            and(
                eq(shifts.branchId, branchId),
                eq(shifts.status, 'OPEN')
            )
        );

        if (existingOpenShift.length > 0) {
            return res.status(200).json(existingOpenShift[0]);
        }

        const [newShift] = await db.insert(shifts).values({
            id,
            branchId,
            userId,
            openingBalance,
            status: 'OPEN',
            notes,
            openingTime: new Date(),
        }).returning();

        res.status(201).json(newShift);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const closeShift = async (req: Request, res: Response) => {
    try {
        const { actualBalance, notes } = req.body;
        const shiftId = req.params.id;

        const shift = await db.select().from(shifts).where(eq(shifts.id, shiftId));
        if (shift.length === 0) return res.status(404).json({ error: 'Shift not found' });
        if (shift[0].status === 'CLOSED') return res.status(400).json({ error: 'Shift is already closed' });

        // Calculate expected balance: Opening + Cash Payments
        // We need to sum up all cash payments for orders within this shift's timeframe
        const cashTotalResult = await db.select({
            sum: sql<number>`sum(amount)`
        }).from(payments)
            .innerJoin(orders, eq(payments.orderId, orders.id))
            .where(
                and(
                    eq(orders.branchId, shift[0].branchId),
                    eq(payments.method, 'CASH'),
                    sql`payments.created_at >= ${shift[0].openingTime}`
                )
            );

        const cashTotal = Number(cashTotalResult[0]?.sum || 0);
        const expectedBalance = Number(shift[0].openingBalance) + cashTotal;

        const [updatedShift] = await db.update(shifts)
            .set({
                status: 'CLOSED',
                closingTime: new Date(),
                expectedBalance,
                actualBalance,
                notes: notes || shift[0].notes,
                updatedAt: new Date(),
            })
            .where(eq(shifts.id, shiftId))
            .returning();

        res.json(updatedShift);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getActiveShift = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.query;
        const activeShift = await db.select().from(shifts).where(
            and(
                eq(shifts.branchId, branchId as string),
                eq(shifts.status, 'OPEN')
            )
        );

        if (activeShift.length === 0) return res.status(404).json({ error: 'No active shift found' });
        res.json(activeShift[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * X-Report: Mid-shift summary (running totals without closing)
 */
export const getXReport = async (req: Request, res: Response) => {
    try {
        const shiftId = req.params.id;

        const shift = await db.select().from(shifts).where(eq(shifts.id, shiftId));
        if (shift.length === 0) return res.status(404).json({ error: 'Shift not found' });

        // Get all orders linked to this shift
        const orderStats = await db.select({
            count: sql<number>`count(*)`,
            totalSales: sql<number>`sum(total)`,
            netSales: sql<number>`sum(subtotal - discount)`,
            totalTax: sql<number>`sum(tax)`,
            totalServiceCharge: sql<number>`sum(service_charge)`
        }).from(orders).where(eq(orders.shiftId, shiftId));

        // Get payment breakdown
        const paymentBreakdown = await db.select({
            method: payments.method,
            total: sql<number>`sum(amount)`,
            count: sql<number>`count(*)`
        }).from(payments)
            .innerJoin(orders, eq(payments.orderId, orders.id))
            .where(eq(orders.shiftId, shiftId))
            .groupBy(payments.method);

        const cashPayments = paymentBreakdown.find(p => p.method === 'CASH');
        const expectedCash = Number(shift[0].openingBalance) + Number(cashPayments?.total || 0);

        res.json({
            shiftId,
            openingBalance: shift[0].openingBalance,
            openingTime: shift[0].openingTime,
            reportTime: new Date(),
            sales: {
                orderCount: orderStats[0]?.count || 0,
                grossSales: orderStats[0]?.totalSales || 0,
                netSales: orderStats[0]?.netSales || 0,
                vatCollected: orderStats[0]?.totalTax || 0,
                serviceChargeCollected: orderStats[0]?.totalServiceCharge || 0
            },
            payments: paymentBreakdown,
            expectedCashInDrawer: expectedCash
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
