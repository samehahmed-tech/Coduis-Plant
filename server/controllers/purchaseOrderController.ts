import { Request, Response } from 'express';
import { db } from '../db';
import { purchaseOrders, purchaseOrderItems, inventoryStock, stockMovements, inventoryItems } from '../../src/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';

/**
 * Create new Purchase Order
 */
export const createPO = async (req: Request, res: Response) => {
    try {
        const { id, supplierId, branchId, expectedDate, notes, items, createdBy } = req.body;

        if (!supplierId || !branchId || !items || items.length === 0) {
            return res.status(400).json({ error: 'supplierId, branchId, and items are required' });
        }

        const subtotal = items.reduce((sum: number, item: any) => sum + (item.orderedQty * item.unitPrice), 0);

        const savedPO = await db.transaction(async (tx) => {
            // 1. Create PO header
            const [po] = await tx.insert(purchaseOrders).values({
                id: id || `PO-${Date.now()}`,
                supplierId,
                branchId,
                status: 'DRAFT',
                expectedDate: expectedDate ? new Date(expectedDate) : null,
                subtotal,
                notes,
                createdBy,
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning();

            // 2. Create PO line items
            for (const item of items) {
                await tx.insert(purchaseOrderItems).values({
                    poId: po.id,
                    itemId: item.itemId,
                    orderedQty: item.orderedQty,
                    receivedQty: 0,
                    unitPrice: item.unitPrice,
                });
            }

            return po;
        });

        res.status(201).json(savedPO);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Receive goods against a PO (partial or full)
 */
export const receivePO = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { warehouseId, items, receivedBy } = req.body;

        if (!warehouseId || !items || items.length === 0) {
            return res.status(400).json({ error: 'warehouseId and items are required' });
        }

        await db.transaction(async (tx) => {
            for (const item of items) {
                const { itemId, receivedQty } = item;

                // 1. Update PO item received quantity
                await tx.update(purchaseOrderItems)
                    .set({ receivedQty: sql`received_qty + ${receivedQty}` })
                    .where(
                        and(
                            eq(purchaseOrderItems.poId, id),
                            eq(purchaseOrderItems.itemId, itemId)
                        )
                    );

                // 2. Add to inventory stock
                const existingStock = await tx.select()
                    .from(inventoryStock)
                    .where(
                        and(
                            eq(inventoryStock.itemId, itemId),
                            eq(inventoryStock.warehouseId, warehouseId)
                        )
                    );

                if (existingStock.length > 0) {
                    await tx.update(inventoryStock)
                        .set({
                            quantity: sql`quantity + ${receivedQty}`,
                            lastUpdated: new Date(),
                        })
                        .where(
                            and(
                                eq(inventoryStock.itemId, itemId),
                                eq(inventoryStock.warehouseId, warehouseId)
                            )
                        );
                } else {
                    await tx.insert(inventoryStock).values({
                        itemId,
                        warehouseId,
                        quantity: receivedQty,
                        lastUpdated: new Date(),
                    });
                }

                // 3. Create stock movement
                await tx.insert(stockMovements).values({
                    itemId,
                    toWarehouseId: warehouseId,
                    quantity: receivedQty,
                    type: 'PURCHASE',
                    referenceId: id,
                    reason: 'Goods Receipt from PO',
                    performedBy: receivedBy || 'system',
                    createdAt: new Date(),
                });
            }

            // 4. Update PO status
            const poItems = await tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poId, id));
            const allReceived = poItems.every(item => Number(item.receivedQty) >= Number(item.orderedQty));
            const anyReceived = poItems.some(item => Number(item.receivedQty) > 0);

            await tx.update(purchaseOrders)
                .set({
                    status: allReceived ? 'RECEIVED' : (anyReceived ? 'PARTIAL' : 'SENT'),
                    updatedAt: new Date(),
                })
                .where(eq(purchaseOrders.id, id));
        });

        res.json({ success: true, message: 'Goods received successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get all Purchase Orders
 */
export const getPOs = async (req: Request, res: Response) => {
    try {
        const { status, supplierId } = req.query;

        let query = db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));

        if (status) {
            query = query.where(eq(purchaseOrders.status, status as string));
        }
        if (supplierId) {
            query = query.where(eq(purchaseOrders.supplierId, supplierId as string));
        }

        const pos = await query.limit(100);
        res.json(pos);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get PO by ID with items
 */
export const getPOById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
        if (!po) {
            return res.status(404).json({ error: 'Purchase Order not found' });
        }

        const items = await db.select({
            id: purchaseOrderItems.id,
            itemId: purchaseOrderItems.itemId,
            itemName: inventoryItems.name,
            orderedQty: purchaseOrderItems.orderedQty,
            receivedQty: purchaseOrderItems.receivedQty,
            unitPrice: purchaseOrderItems.unitPrice,
        })
            .from(purchaseOrderItems)
            .innerJoin(inventoryItems, eq(purchaseOrderItems.itemId, inventoryItems.id))
            .where(eq(purchaseOrderItems.poId, id));

        res.json({ ...po, items });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update PO status (e.g., DRAFT -> SENT)
 */
export const updatePOStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const [updated] = await db.update(purchaseOrders)
            .set({ status, updatedAt: new Date() })
            .where(eq(purchaseOrders.id, id))
            .returning();

        if (!updated) {
            return res.status(404).json({ error: 'Purchase Order not found' });
        }

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
