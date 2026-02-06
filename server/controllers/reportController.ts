import { Request, Response } from 'express';
import { db } from '../db';
import { orders, payments } from '../../src/db/schema';
import { eq, and, sql, gte, lte, inArray, desc } from 'drizzle-orm';

export const getVatReport = async (req: Request, res: Response) => {
    try {
        const { branchId, startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);

        const report = await db.select({
            count: sql<number>`count(*)`,
            netTotal: sql<number>`sum(subtotal - discount)`,
            taxTotal: sql<number>`sum(tax)`,
            serviceChargeTotal: sql<number>`sum(service_charge)`,
            grandTotal: sql<number>`sum(total)`
        }).from(orders)
            .where(
                and(
                    branchId ? eq(orders.branchId, branchId as string) : undefined,
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end),
                    inArray(orders.status, ['DELIVERED', 'COMPLETED'])
                )
            );

        res.json({
            period: { start, end },
            branchId: branchId || 'ALL',
            summary: report[0] || { count: 0, netTotal: 0, taxTotal: 0, serviceChargeTotal: 0, grandTotal: 0 }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getPaymentMethodSummary = async (req: Request, res: Response) => {
    try {
        const { branchId, startDate, endDate } = req.query;

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);

        const summary = await db.select({
            method: payments.method,
            total: sql<number>`sum(amount)`,
            count: sql<number>`count(*)`
        }).from(payments)
            .innerJoin(orders, eq(payments.orderId, orders.id))
            .where(
                and(
                    branchId ? eq(orders.branchId, branchId as string) : undefined,
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end)
                )
            )
            .groupBy(payments.method);

        res.json(summary);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getFiscalSummary = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);

        const summary = await db.select({
            totalSales: sql<number>`sum(total)`,
            netSales: sql<number>`sum(subtotal - discount)`,
            vatAmount: sql<number>`sum(tax)`,
            orderCount: sql<number>`count(*)`
        }).from(orders)
            .where(
                and(
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end),
                    inArray(orders.status, ['DELIVERED', 'COMPLETED'])
                )
            );

        const [latestOrder] = await db.select({ id: orders.id }).from(orders).orderBy(desc(orders.createdAt)).limit(1);

        res.json({
            taxPeriod: `${start.getFullYear()}-${start.getMonth() + 1}`,
            data: {
                ...(summary[0] || { totalSales: 0, netSales: 0, vatAmount: 0, orderCount: 0 }),
                latestOrderId: latestOrder?.id
            }
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getDailySales = async (req: Request, res: Response) => {
    try {
        const { branchId, startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);

        const rows = await db.select({
            day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
            revenue: sql<number>`sum(${orders.total})`,
            net: sql<number>`sum(${orders.subtotal} - ${orders.discount})`,
            tax: sql<number>`sum(${orders.tax})`,
            orderCount: sql<number>`count(*)`
        }).from(orders)
            .where(
                and(
                    branchId ? eq(orders.branchId, branchId as string) : undefined,
                    gte(orders.createdAt, start),
                    lte(orders.createdAt, end),
                    inArray(orders.status, ['DELIVERED', 'COMPLETED'])
                )
            )
            .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD') asc`);

        res.json(rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
