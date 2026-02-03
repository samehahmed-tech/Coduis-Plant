import { Request, Response } from 'express';
import { db } from '../db';
import { stockMovements, inventoryStock, inventoryItems } from '../../src/db/schema';
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm';

/**
 * Record wastage (burnt, expired, damaged)
 */
export const recordWastage = async (req: Request, res: Response) => {
    try {
        const { itemId, warehouseId, quantity, reason, notes, performedBy } = req.body;

        if (!itemId || !warehouseId || !quantity || !reason) {
            return res.status(400).json({ error: 'itemId, warehouseId, quantity, and reason are required' });
        }

        // 1. Deduct from stock
        await db.update(inventoryStock)
            .set({
                quantity: sql`quantity - ${quantity}`,
                lastUpdated: new Date(),
            })
            .where(
                and(
                    eq(inventoryStock.itemId, itemId),
                    eq(inventoryStock.warehouseId, warehouseId)
                )
            );

        // 2. Create wastage movement
        const [movement] = await db.insert(stockMovements).values({
            itemId,
            fromWarehouseId: warehouseId,
            quantity,
            type: 'WASTE',
            reason, // BURNT, EXPIRED, DAMAGED, SPILLAGE, OTHER
            referenceId: notes || null,
            performedBy: performedBy || 'system',
            createdAt: new Date(),
        }).returning();

        res.status(201).json({
            success: true,
            movement,
            message: `Recorded ${quantity} units of waste for item ${itemId}`
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get wastage report (aggregated by date, item, reason)
 */
export const getWastageReport = async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, warehouseId } = req.query;

        let query = db.select({
            itemId: stockMovements.itemId,
            itemName: inventoryItems.name,
            reason: stockMovements.reason,
            totalQty: sql<number>`sum(${stockMovements.quantity})`,
            count: sql<number>`count(*)`,
        })
            .from(stockMovements)
            .innerJoin(inventoryItems, eq(stockMovements.itemId, inventoryItems.id))
            .where(eq(stockMovements.type, 'WASTE'))
            .groupBy(stockMovements.itemId, inventoryItems.name, stockMovements.reason)
            .orderBy(desc(sql`sum(${stockMovements.quantity})`));

        const report = await query;

        // Get totals
        const totalsQuery = await db.select({
            totalItems: sql<number>`count(distinct ${stockMovements.itemId})`,
            totalIncidents: sql<number>`count(*)`,
            totalQty: sql<number>`sum(${stockMovements.quantity})`,
        })
            .from(stockMovements)
            .where(eq(stockMovements.type, 'WASTE'));

        res.json({
            items: report,
            summary: totalsQuery[0],
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get recent wastage entries
 */
export const getRecentWastage = async (req: Request, res: Response) => {
    try {
        const { limit = 50 } = req.query;

        const entries = await db.select({
            id: stockMovements.id,
            itemId: stockMovements.itemId,
            itemName: inventoryItems.name,
            quantity: stockMovements.quantity,
            reason: stockMovements.reason,
            performedBy: stockMovements.performedBy,
            createdAt: stockMovements.createdAt,
        })
            .from(stockMovements)
            .innerJoin(inventoryItems, eq(stockMovements.itemId, inventoryItems.id))
            .where(eq(stockMovements.type, 'WASTE'))
            .orderBy(desc(stockMovements.createdAt))
            .limit(Number(limit));

        res.json(entries);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
