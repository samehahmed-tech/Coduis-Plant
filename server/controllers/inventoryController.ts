import { Request, Response } from 'express';
import { db } from '../db';
import { inventoryItems, inventoryStock, stockMovements } from '../../src/db/schema';
import { and, asc, eq } from 'drizzle-orm';

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
        const { id } = req.params;
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
        const { id } = req.params;
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

        const [existing] = await db.select().from(inventoryStock).where(
            and(eq(inventoryStock.itemId, item_id), eq(inventoryStock.warehouseId, warehouse_id))
        );

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
        }

        res.json({ success: true, previousQuantity: previousQty, newQuantity: newQty, delta });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
