import { Request, Response } from 'express';
import { db } from '../db';
import { settings, inventoryStock, stockMovements, inventoryItems, warehouses, auditLogs } from '../../src/db/schema';
import { and, eq } from 'drizzle-orm';
import { postProductionCompletionEntry } from '../services/financePostingService';
import { getStringParam } from '../utils/request';

const PRODUCTION_ORDERS_KEY = 'production_orders_v1';

type ProductionOrderRecord = {
    id: string;
    targetItemId: string;
    quantityRequested: number;
    quantityProduced: number;
    warehouseId: string;
    branchId?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    batchNumber: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    actorId?: string;
    ingredientsReserved?: { itemId: string; quantity: number }[];
    actualIngredientsConsumed?: { itemId: string; quantity: number }[];
    yieldVarianceQty?: number;
    ingredientsConsumed: { itemId: string; quantity: number }[];
};

const readOrders = async (): Promise<ProductionOrderRecord[]> => {
    const [row] = await db.select().from(settings).where(eq(settings.key, PRODUCTION_ORDERS_KEY));
    const value = (row?.value as ProductionOrderRecord[]) || [];
    return Array.isArray(value) ? value : [];
};

const writeOrders = async (orders: ProductionOrderRecord[], updatedBy: string) => {
    const [existing] = await db.select().from(settings).where(eq(settings.key, PRODUCTION_ORDERS_KEY));
    if (existing) {
        await db.update(settings).set({
            value: orders as any,
            category: 'production',
            updatedBy,
            updatedAt: new Date(),
        }).where(eq(settings.key, PRODUCTION_ORDERS_KEY));
    } else {
        await db.insert(settings).values({
            key: PRODUCTION_ORDERS_KEY,
            value: orders as any,
            category: 'production',
            updatedBy,
            updatedAt: new Date(),
        } as any);
    }
};

export const getProductionOrders = async (req: Request, res: Response) => {
    try {
        const status = getStringParam(req.query.status);
        const branchId = getStringParam(req.query.branchId);
        const orders = await readOrders();
        const filtered = orders.filter((o) => {
            if (status && o.status !== status) return false;
            if (branchId && o.branchId !== branchId) return false;
            return true;
        });
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json(filtered);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createProductionOrder = async (req: Request, res: Response) => {
    try {
        const { targetItemId, quantityRequested, warehouseId, actorId } = req.body || {};
        if (!targetItemId || !warehouseId || !quantityRequested || Number(quantityRequested) <= 0) {
            return res.status(400).json({ error: 'targetItemId, warehouseId, and quantityRequested are required' });
        }

        const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, targetItemId));
        if (!item) return res.status(404).json({ error: 'Target item not found' });
        const [warehouse] = await db.select().from(warehouses).where(eq(warehouses.id, warehouseId));
        if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });

        const qty = Number(quantityRequested);
        const bom = Array.isArray(item.bom) ? item.bom : [];
        const ingredientsConsumed = bom.map((b: any) => ({
            itemId: b.inventoryItemId,
            quantity: Number(b.quantity || 0) * qty,
        })).filter((i: any) => i.itemId && i.quantity > 0);

        const created: ProductionOrderRecord = {
            id: `PROD-${Date.now()}`,
            targetItemId,
            quantityRequested: qty,
            quantityProduced: 0,
            warehouseId,
            branchId: warehouse.branchId || undefined,
            status: 'PENDING',
            batchNumber: `B-${Date.now()}`,
            createdAt: new Date().toISOString(),
            actorId: actorId || 'system',
            ingredientsConsumed,
        };

        const current = await readOrders();
        await writeOrders([created, ...current], actorId || 'system');
        res.status(201).json(created);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const startProductionOrder = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'PRODUCTION_ORDER_ID_REQUIRED' });
        const actorId = req.body?.actorId || 'system';

        const orders = await readOrders();
        const idx = orders.findIndex((o) => o.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Production order not found' });
        if (orders[idx].status !== 'PENDING') {
            return res.status(400).json({ error: 'Only PENDING orders can be started' });
        }

        const order = orders[idx];
        const reservedIngredients = (order.ingredientsConsumed || []).map((i) => ({
            itemId: i.itemId,
            quantity: Number(i.quantity || 0),
        })).filter((i) => i.itemId && i.quantity > 0);

        await db.transaction(async (tx) => {
            for (const ingredient of reservedIngredients) {
                const [stock] = await tx.select().from(inventoryStock).where(and(
                    eq(inventoryStock.itemId, ingredient.itemId),
                    eq(inventoryStock.warehouseId, order.warehouseId)
                ));
                const currentQty = Number(stock?.quantity || 0);
                if (currentQty < ingredient.quantity) {
                    throw new Error(`Insufficient stock for ingredient ${ingredient.itemId}`);
                }
                await tx.update(inventoryStock)
                    .set({ quantity: currentQty - ingredient.quantity, lastUpdated: new Date() })
                    .where(eq(inventoryStock.id, stock.id));

                await tx.insert(stockMovements).values({
                    itemId: ingredient.itemId,
                    fromWarehouseId: order.warehouseId,
                    quantity: ingredient.quantity,
                    type: 'ADJUSTMENT',
                    reason: `Production reserve ${id}`,
                    referenceId: id,
                    performedBy: actorId,
                    createdAt: new Date(),
                });
            }
        });

        orders[idx] = {
            ...order,
            status: 'IN_PROGRESS',
            startedAt: new Date().toISOString(),
            ingredientsReserved: reservedIngredients,
        };
        await writeOrders(orders, actorId);

        await db.insert(auditLogs).values({
            eventType: 'PRODUCTION_ORDER_STARTED',
            userId: actorId || null,
            branchId: order.branchId || null,
            payload: {
                orderId: id,
                reservedIngredients,
            },
            createdAt: new Date(),
        });

        res.json(orders[idx]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const completeProductionOrder = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'PRODUCTION_ORDER_ID_REQUIRED' });
        const actorId = req.body?.actorId || 'system';
        const quantityProducedInput = Number(req.body?.quantityProduced || 0);
        const actualIngredientsInput = Array.isArray(req.body?.actualIngredientsConsumed) ? req.body.actualIngredientsConsumed : null;

        const orders = await readOrders();
        const idx = orders.findIndex((o) => o.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Production order not found' });
        const order = orders[idx];
        if (order.status !== 'IN_PROGRESS') {
            return res.status(400).json({ error: 'Only IN_PROGRESS orders can be completed' });
        }
        const quantityProduced = quantityProducedInput > 0 ? quantityProducedInput : Number(order.quantityRequested || 0);
        if (quantityProduced <= 0) {
            return res.status(400).json({ error: 'Invalid quantityProduced' });
        }
        const reservedByItem = new Map<string, number>(
            (order.ingredientsReserved || order.ingredientsConsumed || []).map((i) => [String(i.itemId), Number(i.quantity || 0)])
        );
        const actualIngredients = (actualIngredientsInput || order.ingredientsReserved || order.ingredientsConsumed || [])
            .map((i: any) => ({ itemId: i.itemId, quantity: Number(i.quantity || 0) }))
            .filter((i: any) => i.itemId && i.quantity >= 0);
        const actualByItem = new Map<string, number>(actualIngredients.map((i: any) => [String(i.itemId), Number(i.quantity || 0)]));

        let totalConsumedCost = 0;
        let additionalWasteCost = 0;
        await db.transaction(async (tx) => {
            const ingredientIds = Array.from(new Set<string>([
                ...Array.from(reservedByItem.keys()),
                ...Array.from(actualByItem.keys()),
            ]));
            for (const ingredientId of ingredientIds) {
                const reservedQty = Number(reservedByItem.get(ingredientId) || 0);
                const actualQty = Number(actualByItem.get(ingredientId) || 0);
                const [ingredientItem] = await tx.select().from(inventoryItems).where(eq(inventoryItems.id, ingredientId));
                const unitCost = Number(ingredientItem?.costPrice || 0);
                totalConsumedCost += actualQty * unitCost;

                if (actualQty > reservedQty) {
                    const extraQty = actualQty - reservedQty;
                    const [stock] = await tx.select().from(inventoryStock).where(and(
                        eq(inventoryStock.itemId, ingredientId),
                        eq(inventoryStock.warehouseId, order.warehouseId)
                    ));
                    const currentQty = Number(stock?.quantity || 0);
                    if (currentQty < extraQty) {
                        throw new Error(`Insufficient stock for ingredient ${ingredientId}`);
                    }
                    await tx.update(inventoryStock)
                        .set({ quantity: currentQty - extraQty, lastUpdated: new Date() })
                        .where(eq(inventoryStock.id, stock.id));
                    await tx.insert(stockMovements).values({
                        itemId: ingredientId,
                        fromWarehouseId: order.warehouseId,
                        quantity: extraQty,
                        type: 'ADJUSTMENT',
                        reason: `Production extra consumption ${id}`,
                        referenceId: id,
                        performedBy: actorId,
                        createdAt: new Date(),
                    });
                    additionalWasteCost += extraQty * unitCost;
                } else if (actualQty < reservedQty) {
                    const releaseQty = reservedQty - actualQty;
                    const [stock] = await tx.select().from(inventoryStock).where(and(
                        eq(inventoryStock.itemId, ingredientId),
                        eq(inventoryStock.warehouseId, order.warehouseId)
                    ));
                    if (stock) {
                        await tx.update(inventoryStock)
                            .set({ quantity: Number(stock.quantity || 0) + releaseQty, lastUpdated: new Date() })
                            .where(eq(inventoryStock.id, stock.id));
                    } else {
                        await tx.insert(inventoryStock).values({
                            itemId: ingredientId,
                            warehouseId: order.warehouseId,
                            quantity: releaseQty,
                            lastUpdated: new Date(),
                        });
                    }
                    await tx.insert(stockMovements).values({
                        itemId: ingredientId,
                        toWarehouseId: order.warehouseId,
                        quantity: releaseQty,
                        type: 'ADJUSTMENT',
                        reason: `Production reserve release ${id}`,
                        referenceId: id,
                        performedBy: actorId,
                        createdAt: new Date(),
                    });
                }
            }

            const [finishedStock] = await tx.select().from(inventoryStock).where(and(
                eq(inventoryStock.itemId, order.targetItemId),
                eq(inventoryStock.warehouseId, order.warehouseId)
            ));
            if (finishedStock) {
                await tx.update(inventoryStock)
                    .set({ quantity: Number(finishedStock.quantity || 0) + quantityProduced, lastUpdated: new Date() })
                    .where(eq(inventoryStock.id, finishedStock.id));
            } else {
                await tx.insert(inventoryStock).values({
                    itemId: order.targetItemId,
                    warehouseId: order.warehouseId,
                    quantity: quantityProduced,
                    lastUpdated: new Date(),
                });
            }

            await tx.insert(stockMovements).values({
                itemId: order.targetItemId,
                toWarehouseId: order.warehouseId,
                quantity: quantityProduced,
                type: 'ADJUSTMENT',
                reason: `Production output ${id}`,
                referenceId: id,
                performedBy: actorId,
                createdAt: new Date(),
            });
        });
        const yieldVarianceQty = Number(quantityProduced || 0) - Number(order.quantityRequested || 0);

        orders[idx] = {
            ...order,
            status: 'COMPLETED',
            quantityProduced,
            completedAt: new Date().toISOString(),
            actualIngredientsConsumed: actualIngredients,
            yieldVarianceQty,
        };
        await writeOrders(orders, actorId);

        await db.insert(auditLogs).values({
            eventType: 'PRODUCTION_ORDER_COMPLETED',
            userId: actorId || null,
            branchId: order.branchId || null,
            payload: {
                orderId: id,
                targetItemId: order.targetItemId,
                quantityProduced,
                ingredientsReserved: order.ingredientsReserved || order.ingredientsConsumed,
                actualIngredientsConsumed: actualIngredients,
                yieldVarianceQty,
                totalConsumedCost,
            },
            createdAt: new Date(),
        });

        postProductionCompletionEntry({
            productionOrderId: id,
            amount: totalConsumedCost,
            branchId: order.branchId,
            userId: actorId,
        }).catch(() => undefined);

        if (additionalWasteCost > 0) {
            await db.insert(auditLogs).values({
                eventType: 'PRODUCTION_WASTAGE_VARIANCE',
                userId: actorId || null,
                branchId: order.branchId || null,
                payload: {
                    orderId: id,
                    additionalWasteCost,
                },
                createdAt: new Date(),
            });
        }

        res.json(orders[idx]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const cancelProductionOrder = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'PRODUCTION_ORDER_ID_REQUIRED' });
        const actorId = req.body?.actorId || 'system';
        const orders = await readOrders();
        const idx = orders.findIndex((o) => o.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Production order not found' });
        if (orders[idx].status === 'COMPLETED') {
            return res.status(400).json({ error: 'Completed orders cannot be cancelled' });
        }
        const order = orders[idx];
        if (order.status === 'IN_PROGRESS') {
            await db.transaction(async (tx) => {
                for (const ingredient of order.ingredientsReserved || []) {
                    const qty = Number(ingredient.quantity || 0);
                    if (qty <= 0) continue;
                    const [stock] = await tx.select().from(inventoryStock).where(and(
                        eq(inventoryStock.itemId, ingredient.itemId),
                        eq(inventoryStock.warehouseId, order.warehouseId)
                    ));
                    if (stock) {
                        await tx.update(inventoryStock)
                            .set({ quantity: Number(stock.quantity || 0) + qty, lastUpdated: new Date() })
                            .where(eq(inventoryStock.id, stock.id));
                    } else {
                        await tx.insert(inventoryStock).values({
                            itemId: ingredient.itemId,
                            warehouseId: order.warehouseId,
                            quantity: qty,
                            lastUpdated: new Date(),
                        });
                    }
                    await tx.insert(stockMovements).values({
                        itemId: ingredient.itemId,
                        toWarehouseId: order.warehouseId,
                        quantity: qty,
                        type: 'ADJUSTMENT',
                        reason: `Production cancel release ${id}`,
                        referenceId: id,
                        performedBy: actorId,
                        createdAt: new Date(),
                    });
                }
            });
        }
        orders[idx] = { ...order, status: 'CANCELLED' };
        await writeOrders(orders, actorId);
        res.json(orders[idx]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
