import { Request, Response } from 'express';
import { db } from '../db';
import { branches, orders, inventoryStock, warehouses, inventoryItems } from '../../src/db/schema';
import { and, eq, gte, inArray } from 'drizzle-orm';

export const getBranchPerformance = async (req: Request, res: Response) => {
    try {
        const user = req.user;
        const startDateRaw = req.query.startDate as string | undefined;
        const endDateRaw = req.query.endDate as string | undefined;
        const startDate = startDateRaw ? new Date(startDateRaw) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = endDateRaw ? new Date(endDateRaw) : new Date();

        const branchFilterId = req.query.branchId as string | undefined;
        const roleScopedBranchId = user?.role === 'BRANCH_MANAGER' ? (user.branchId || undefined) : undefined;
        const effectiveBranchId = roleScopedBranchId || branchFilterId;

        const allBranches = effectiveBranchId
            ? await db.select().from(branches).where(eq(branches.id, effectiveBranchId))
            : await db.select().from(branches).where(eq(branches.isActive, true));

        const branchIds = allBranches.map(b => b.id);
        if (branchIds.length === 0) return res.json([]);

        const branchOrders = await db.select().from(orders).where(
            and(
                inArray(orders.branchId, branchIds),
                gte(orders.createdAt, startDate),
            )
        );

        const branchWarehouses = await db.select().from(warehouses).where(inArray(warehouses.branchId, branchIds));
        const warehouseIds = branchWarehouses.map(w => w.id);
        const stocks = warehouseIds.length > 0
            ? await db.select().from(inventoryStock).where(inArray(inventoryStock.warehouseId, warehouseIds))
            : [];
        const itemIds = Array.from(new Set(stocks.map(s => s.itemId)));
        const items = itemIds.length > 0 ? await db.select().from(inventoryItems).where(inArray(inventoryItems.id, itemIds)) : [];
        const thresholdByItem = new Map(items.map(i => [i.id, Number(i.threshold || 0)]));
        const warehouseToBranch = new Map(branchWarehouses.map(w => [w.id, w.branchId]));

        const output = allBranches.map(branch => {
            const scopedOrders = branchOrders.filter(o => o.branchId === branch.id);
            const revenue = scopedOrders.reduce((s, o) => s + Number(o.total || 0), 0);
            const ordersCount = scopedOrders.length;
            const avgTicket = ordersCount > 0 ? revenue / ordersCount : 0;
            const cancelled = scopedOrders.filter(o => String(o.status) === 'CANCELLED').length;
            const activeOrders = scopedOrders.filter(o => !['DELIVERED', 'CANCELLED'].includes(String(o.status))).length;

            const lowStock = stocks.filter(s => {
                const bId = warehouseToBranch.get(s.warehouseId);
                if (bId !== branch.id) return false;
                const threshold = thresholdByItem.get(s.itemId) || 0;
                return Number(s.quantity || 0) <= threshold;
            }).length;

            return {
                branchId: branch.id,
                branchName: branch.name,
                location: branch.location || branch.address || '',
                revenue,
                ordersCount,
                avgTicket,
                cancelled,
                activeOrders,
                lowStock,
            };
        });

        res.json(output);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
