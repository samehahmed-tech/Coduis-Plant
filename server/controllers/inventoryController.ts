import { Request, Response } from 'express';
import { db } from '../db';
import { inventoryItems, inventoryStock, stockMovements, warehouses, auditLogs } from '../../src/db/schema';
import { and, asc, desc, eq } from 'drizzle-orm';
import { getStringParam } from '../utils/request';
import { postInventoryAdjustmentEntry, postInventoryAdjustmentReversalEntry } from '../services/financePostingService';

/**
 * Inventory Items
 */
export const getInventoryItems = async (req: Request, res: Response) => {
    try {
        const items = await db.select().from(inventoryItems).orderBy(asc(inventoryItems.name));
        const stocks = await db.select().from(inventoryStock);

        const stockMap = new Map<string, { warehouseId: string; quantity: number }[]>();
        for (const stock of stocks) {
            const list = stockMap.get(stock.itemId) || [];
            list.push({ warehouseId: stock.warehouseId, quantity: Number(stock.quantity) || 0 });
            stockMap.set(stock.itemId, list);
        }

        const result = items.map((item) => ({
            id: item.id,
            name: item.name,
            name_ar: item.nameAr,
            sku: item.sku,
            barcode: item.barcode,
            unit: item.unit,
            category: item.category,
            threshold: Number(item.threshold) || 0,
            cost_price: Number(item.costPrice) || 0,
            purchase_price: Number(item.purchasePrice) || 0,
            supplier_id: item.supplierId,
            is_audited: item.isAudited ?? true,
            audit_frequency: item.auditFrequency ?? 'DAILY',
            is_composite: item.isComposite ?? false,
            bom: item.bom ?? [],
            is_active: item.isActive !== false,
            warehouseQuantities: stockMap.get(item.id) || [],
        }));

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createInventoryItem = async (req: Request, res: Response) => {
    try {
        const body = req.body || {};

        if (!body.name || !body.unit) {
            return res.status(400).json({ error: 'name and unit are required' });
        }

        const [created] = await db.insert(inventoryItems).values({
            id: body.id || `INV-${Date.now()}`,
            name: body.name,
            nameAr: body.name_ar,
            sku: body.sku,
            barcode: body.barcode,
            unit: body.unit,
            category: body.category,
            threshold: body.threshold,
            costPrice: body.cost_price,
            purchasePrice: body.purchase_price,
            supplierId: body.supplier_id,
            isAudited: body.is_audited,
            auditFrequency: body.audit_frequency,
            isComposite: body.is_composite,
            bom: body.bom,
            isActive: body.is_active !== false,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        res.status(201).json(created);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateInventoryItem = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'ITEM_ID_REQUIRED' });
        const body = req.body || {};

        const updates: Record<string, any> = { updatedAt: new Date() };
        if (body.name !== undefined) updates.name = body.name;
        if (body.name_ar !== undefined) updates.nameAr = body.name_ar;
        if (body.sku !== undefined) updates.sku = body.sku;
        if (body.barcode !== undefined) updates.barcode = body.barcode;
        if (body.unit !== undefined) updates.unit = body.unit;
        if (body.category !== undefined) updates.category = body.category;
        if (body.threshold !== undefined) updates.threshold = body.threshold;
        if (body.cost_price !== undefined) updates.costPrice = body.cost_price;
        if (body.purchase_price !== undefined) updates.purchasePrice = body.purchase_price;
        if (body.supplier_id !== undefined) updates.supplierId = body.supplier_id;
        if (body.is_audited !== undefined) updates.isAudited = body.is_audited;
        if (body.audit_frequency !== undefined) updates.auditFrequency = body.audit_frequency;
        if (body.is_composite !== undefined) updates.isComposite = body.is_composite;
        if (body.bom !== undefined) updates.bom = body.bom;
        if (body.is_active !== undefined) updates.isActive = body.is_active;

        const [updated] = await db.update(inventoryItems)
            .set(updates)
            .where(eq(inventoryItems.id, id))
            .returning();

        if (!updated) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteInventoryItem = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'ITEM_ID_REQUIRED' });
        const [deleted] = await db.delete(inventoryItems).where(eq(inventoryItems.id, id)).returning();
        if (!deleted) return res.status(404).json({ error: 'Inventory item not found' });
        res.json({ message: 'Inventory item deleted', item: deleted });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Stock Adjustments
 */
export const updateStock = async (req: Request, res: Response) => {
    try {
        const { item_id, warehouse_id, quantity, type, reason, actor_id, reference_id } = req.body || {};

        if (!item_id || !warehouse_id || quantity === undefined) {
            return res.status(400).json({ error: 'item_id, warehouse_id, and quantity are required' });
        }

        const newQty = Number(quantity);
        if (Number.isNaN(newQty)) {
            return res.status(400).json({ error: 'quantity must be a number' });
        }

        // Idempotency guard for offline replay: if this reference is already applied, do not apply twice.
        if (reference_id) {
            const [existingMovement] = await db
                .select()
                .from(stockMovements)
                .where(eq(stockMovements.referenceId, String(reference_id)))
                .limit(1);
            if (existingMovement) {
                const [currentStock] = await db.select().from(inventoryStock).where(
                    and(eq(inventoryStock.itemId, item_id), eq(inventoryStock.warehouseId, warehouse_id))
                );
                const currentQty = Number(currentStock?.quantity || 0);
                return res.json({
                    success: true,
                    idempotentReplay: true,
                    referenceId: reference_id,
                    previousQuantity: currentQty,
                    newQuantity: currentQty,
                    delta: 0,
                });
            }
        }

        const [existing] = await db.select().from(inventoryStock).where(
            and(eq(inventoryStock.itemId, item_id), eq(inventoryStock.warehouseId, warehouse_id))
        );
        const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, item_id));
        const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, warehouse_id));

        const previousQty = Number(existing?.quantity || 0);
        const delta = newQty - previousQty;

        if (existing) {
            await db.update(inventoryStock)
                .set({ quantity: newQty, lastUpdated: new Date() })
                .where(eq(inventoryStock.id, existing.id));
        } else {
            await db.insert(inventoryStock).values({
                itemId: item_id,
                warehouseId: warehouse_id,
                quantity: newQty,
                lastUpdated: new Date(),
            });
        }

        if (delta !== 0) {
            const value = Math.abs(delta) * Number(item?.costPrice || 0);
            await db.insert(stockMovements).values({
                itemId: item_id,
                fromWarehouseId: delta < 0 ? warehouse_id : undefined,
                toWarehouseId: delta > 0 ? warehouse_id : undefined,
                quantity: Math.abs(delta),
                type: type || 'ADJUSTMENT',
                reason,
                performedBy: actor_id,
                referenceId: reference_id,
                createdAt: new Date(),
            });

            await db.insert(auditLogs).values({
                eventType: 'INVENTORY_STOCK_ADJUSTMENT',
                userId: actor_id || null,
                branchId: null,
                payload: {
                    itemId: item_id,
                    warehouseId: warehouse_id,
                    previousQuantity: previousQty,
                    newQuantity: newQty,
                    delta,
                    type: type || 'ADJUSTMENT',
                    reason: reason || null,
                    referenceId: reference_id || null,
                },
                createdAt: new Date(),
            });

            const postingData = {
                referenceId: reference_id || `INV-${Date.now()}`,
                amount: value,
                branchId: warehouse?.branchId || undefined,
                userId: actor_id || 'system',
                reason: reason || null,
            };
            if (value > 0) {
                if (delta < 0) {
                    postInventoryAdjustmentEntry(postingData).catch(() => undefined);
                } else {
                    postInventoryAdjustmentReversalEntry(postingData).catch(() => undefined);
                }
            }
        }

        res.json({ success: true, previousQuantity: previousQty, newQuantity: newQty, delta });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Transfer stock between warehouses (transactional)
 */
export const transferStock = async (req: Request, res: Response) => {
    try {
        const {
            item_id,
            from_warehouse_id,
            to_warehouse_id,
            quantity,
            reason,
            actor_id,
            reference_id,
        } = req.body || {};

        if (!item_id || !from_warehouse_id || !to_warehouse_id || quantity === undefined) {
            return res.status(400).json({ error: 'item_id, from_warehouse_id, to_warehouse_id, and quantity are required' });
        }
        if (from_warehouse_id === to_warehouse_id) {
            return res.status(400).json({ error: 'Source and destination warehouses must be different' });
        }

        const transferQty = Number(quantity);
        if (!Number.isFinite(transferQty) || transferQty <= 0) {
            return res.status(400).json({ error: 'quantity must be a positive number' });
        }

        // Idempotency guard for offline replay.
        if (reference_id) {
            const [existingTransfer] = await db.select().from(stockMovements).where(
                and(
                    eq(stockMovements.referenceId, String(reference_id)),
                    eq(stockMovements.type, 'TRANSFER')
                )
            ).limit(1);
            if (existingTransfer) {
                return res.json({
                    success: true,
                    idempotentReplay: true,
                    referenceId: reference_id,
                });
            }
        }

        await db.transaction(async (tx) => {
            const [sourceWarehouse] = await tx.select().from(warehouses).where(eq(warehouses.id, from_warehouse_id));
            const [destWarehouse] = await tx.select().from(warehouses).where(eq(warehouses.id, to_warehouse_id));
            if (!sourceWarehouse || !destWarehouse) {
                throw new Error('Warehouse not found');
            }

            const [sourceStock] = await tx.select().from(inventoryStock).where(
                and(eq(inventoryStock.itemId, item_id), eq(inventoryStock.warehouseId, from_warehouse_id))
            );
            const sourceQty = Number(sourceStock?.quantity || 0);
            if (sourceQty < transferQty) {
                throw new Error('Insufficient stock in source warehouse');
            }

            await tx.update(inventoryStock)
                .set({ quantity: sourceQty - transferQty, lastUpdated: new Date() })
                .where(eq(inventoryStock.id, sourceStock.id));

            const [destStock] = await tx.select().from(inventoryStock).where(
                and(eq(inventoryStock.itemId, item_id), eq(inventoryStock.warehouseId, to_warehouse_id))
            );

            if (destStock) {
                await tx.update(inventoryStock)
                    .set({ quantity: Number(destStock.quantity || 0) + transferQty, lastUpdated: new Date() })
                    .where(eq(inventoryStock.id, destStock.id));
            } else {
                await tx.insert(inventoryStock).values({
                    itemId: item_id,
                    warehouseId: to_warehouse_id,
                    quantity: transferQty,
                    lastUpdated: new Date(),
                });
            }

            await tx.insert(stockMovements).values({
                itemId: item_id,
                fromWarehouseId: from_warehouse_id,
                toWarehouseId: to_warehouse_id,
                quantity: transferQty,
                type: 'TRANSFER',
                reason: reason || 'Inter-warehouse transfer',
                performedBy: actor_id,
                referenceId: reference_id,
                createdAt: new Date(),
            });

            const [fromWarehouse] = await tx.select({ branchId: warehouses.branchId }).from(warehouses).where(eq(warehouses.id, from_warehouse_id));
            await tx.insert(auditLogs).values({
                eventType: 'INVENTORY_BRANCH_TRANSFER',
                userId: actor_id || null,
                branchId: fromWarehouse?.branchId || null,
                payload: {
                    itemId: item_id,
                    fromWarehouseId: from_warehouse_id,
                    toWarehouseId: to_warehouse_id,
                    quantity: transferQty,
                    reason: reason || 'Inter-warehouse transfer',
                    referenceId: reference_id || null,
                },
                createdAt: new Date(),
            });
        });

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get latest transfer movements
 */
export const getTransferMovements = async (req: Request, res: Response) => {
    try {
        const limit = Number(req.query.limit || 100);
        const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 500)) : 100;

        const [movements, itemList, warehouseList] = await Promise.all([
            db.select()
                .from(stockMovements)
                .where(eq(stockMovements.type, 'TRANSFER'))
                .orderBy(desc(stockMovements.createdAt))
                .limit(safeLimit),
            db.select({ id: inventoryItems.id, name: inventoryItems.name }).from(inventoryItems),
            db.select({ id: warehouses.id, name: warehouses.name, branchId: warehouses.branchId }).from(warehouses),
        ]);

        const itemMap = new Map(itemList.map((i) => [i.id, i.name]));
        const warehouseMap = new Map(warehouseList.map((w) => [w.id, w]));

        const result = movements.map((m) => {
            const fromWh = m.fromWarehouseId ? warehouseMap.get(m.fromWarehouseId) : null;
            const toWh = m.toWarehouseId ? warehouseMap.get(m.toWarehouseId) : null;
            return {
                id: m.id,
                itemId: m.itemId,
                itemName: itemMap.get(m.itemId) || m.itemId,
                fromWarehouseId: m.fromWarehouseId,
                fromWarehouseName: fromWh?.name || m.fromWarehouseId,
                fromBranchId: fromWh?.branchId,
                toWarehouseId: m.toWarehouseId,
                toWarehouseName: toWh?.name || m.toWarehouseId,
                toBranchId: toWh?.branchId,
                quantity: Number(m.quantity || 0),
                reason: m.reason,
                performedBy: m.performedBy,
                createdAt: m.createdAt,
                referenceId: m.referenceId,
            };
        });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
