import { Request, Response } from 'express';
import { db } from '../db';
import { tables, floorZones, orders, orderItems } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { getStringParam } from '../utils/request';
import { getIO } from '../socket';

export const getTables = async (req: Request, res: Response) => {
    try {
        const branchId = getStringParam(req.query.branchId);
        if (!branchId) return res.status(400).json({ error: 'Branch ID required' });

        const allTables = await db.select().from(tables).where(eq(tables.branchId, branchId));
        res.json(allTables);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getZones = async (req: Request, res: Response) => {
    try {
        const branchId = getStringParam(req.query.branchId);
        if (!branchId) return res.status(400).json({ error: 'Branch ID required' });

        const allZones = await db.select().from(floorZones).where(eq(floorZones.branchId, branchId));
        res.json(allZones);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const saveLayout = async (req: Request, res: Response) => {
    try {
        const { branchId, zones: zonesData, tables: tablesData } = req.body;

        await db.transaction(async (tx) => {
            // Upsert Zones
            for (const zone of zonesData) {
                await tx.insert(floorZones).values({ ...zone, branchId })
                    .onConflictDoUpdate({ target: floorZones.id, set: zone });
            }

            // Upsert Tables
            // Be careful not to overwrite status/currentOrderId if just updating layout positions
            for (const table of tablesData) {
                // We typically only update layout fields here (x, y, width, height, shape, seats, name, zoneId)
                // If the table is new, insert it.
                await tx.insert(tables).values({
                    ...table,
                    branchId,
                    status: table.status || 'AVAILABLE'
                }).onConflictDoUpdate({
                    target: tables.id,
                    set: {
                        x: table.x,
                        y: table.y,
                        width: table.width,
                        height: table.height,
                        shape: table.shape,
                        seats: table.seats,
                        name: table.name,
                        zoneId: table.zoneId,
                        updatedAt: new Date()
                    }
                });
            }
        });

        try {
            const branchRoom = branchId ? `branch:${branchId}` : null;
            if (branchRoom) {
                getIO().to(branchRoom).emit('table:layout', { branchId });
            }
        } catch {
            // socket is optional
        }

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateTableStatus = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'TABLE_ID_REQUIRED' });
        const { status, currentOrderId } = req.body;

        const [updatedTable] = await db.update(tables)
            .set({
                status,
                currentOrderId: currentOrderId || null,
                updatedAt: new Date()
            })
            .where(eq(tables.id, id))
            .returning();

        if (!updatedTable) return res.status(404).json({ error: 'Table not found' });

        try {
            const branchRoom = updatedTable.branchId ? `branch:${updatedTable.branchId}` : null;
            if (branchRoom) {
                getIO().to(branchRoom).emit('table:status', {
                    id: updatedTable.id,
                    status: updatedTable.status,
                    currentOrderId: updatedTable.currentOrderId
                });
            }
        } catch {
            // socket is optional
        }

        res.json(updatedTable);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const findActiveOrderByTable = async (tx: typeof db, tableId: string) => {
    const rows = await tx.select().from(orders).where(eq(orders.tableId, tableId));
    return rows.find((o) => !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(String(o.status)));
};

const computeSubtotalFromItems = async (tx: typeof db, orderId: string) => {
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    return items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
};

const recalcOrderTotals = async (tx: typeof db, orderId: string) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return null;

    const oldSubtotal = Math.max(0, Number(order.subtotal || 0));
    const oldDiscount = Math.max(0, Number(order.discount || 0));
    const oldNet = Math.max(0.0001, oldSubtotal - oldDiscount);
    const discountRate = oldSubtotal > 0 ? oldDiscount / oldSubtotal : 0;
    const taxRate = Number(order.tax || 0) / oldNet;
    const serviceRate = Number(order.serviceCharge || 0) / oldNet;
    const deliveryFee = Number(order.deliveryFee || 0);

    const subtotal = Number((await computeSubtotalFromItems(tx, orderId)).toFixed(2));
    const discount = Number((subtotal * discountRate).toFixed(2));
    const net = Math.max(0, subtotal - discount);
    const tax = Number((net * (Number.isFinite(taxRate) ? taxRate : 0)).toFixed(2));
    const serviceCharge = Number((net * (Number.isFinite(serviceRate) ? serviceRate : 0)).toFixed(2));
    const total = Number((net + tax + serviceCharge + deliveryFee).toFixed(2));

    const [updated] = await tx.update(orders).set({
        subtotal,
        discount,
        tax,
        serviceCharge,
        total,
        updatedAt: new Date(),
    }).where(eq(orders.id, orderId)).returning();

    return updated || null;
};

const pickItemsToMove = async (
    tx: typeof db,
    sourceOrderId: string,
    selectedItems: Array<{ name?: string; price?: number; quantity?: number }>
) => {
    const sourceItems = await tx.select().from(orderItems).where(eq(orderItems.orderId, sourceOrderId));
    if (!selectedItems || selectedItems.length === 0) {
        return sourceItems;
    }

    const remaining = [...sourceItems];
    const picked: typeof sourceItems = [];

    for (const reqItem of selectedItems) {
        const targetName = String(reqItem?.name || '').trim().toLowerCase();
        const targetPrice = Number(reqItem?.price || 0);
        let neededQty = Math.max(1, Number(reqItem?.quantity || 1));

        for (let i = 0; i < remaining.length && neededQty > 0; i += 1) {
            const candidate = remaining[i];
            if (!candidate) continue;
            const sameName = String(candidate.name || '').trim().toLowerCase() === targetName;
            const samePrice = Number(candidate.price || 0) === targetPrice;
            if (!sameName || !samePrice) continue;

            const availableQty = Number(candidate.quantity || 0);
            if (availableQty <= 0) continue;

            const takeQty = Math.min(availableQty, neededQty);
            picked.push({ ...candidate, quantity: takeQty });
            neededQty -= takeQty;

            if (takeQty === availableQty) {
                remaining.splice(i, 1);
                i -= 1;
            } else {
                remaining[i] = { ...candidate, quantity: availableQty - takeQty };
            }
        }
    }

    return picked;
};

export const transferTableOrder = async (req: Request, res: Response) => {
    try {
        const { sourceTableId, targetTableId } = req.body || {};
        if (!sourceTableId || !targetTableId) {
            return res.status(400).json({ error: 'SOURCE_TARGET_REQUIRED' });
        }
        if (sourceTableId === targetTableId) {
            return res.status(400).json({ error: 'SOURCE_EQUALS_TARGET' });
        }

        const result = await db.transaction(async (tx) => {
            const sourceOrder = await findActiveOrderByTable(tx as any, String(sourceTableId));
            if (!sourceOrder) throw new Error('SOURCE_ORDER_NOT_FOUND');

            const targetOrder = await findActiveOrderByTable(tx as any, String(targetTableId));
            if (targetOrder) throw new Error('TARGET_TABLE_HAS_ACTIVE_ORDER');

            const [movedOrder] = await tx.update(orders).set({
                tableId: String(targetTableId),
                updatedAt: new Date(),
            }).where(eq(orders.id, sourceOrder.id)).returning();

            await tx.update(tables).set({
                status: 'AVAILABLE',
                currentOrderId: null,
                updatedAt: new Date(),
            }).where(eq(tables.id, String(sourceTableId)));

            await tx.update(tables).set({
                status: 'OCCUPIED',
                currentOrderId: movedOrder.id,
                updatedAt: new Date(),
            }).where(eq(tables.id, String(targetTableId)));

            return { movedOrder };
        });

        try {
            if (result.movedOrder?.branchId) {
                const room = `branch:${result.movedOrder.branchId}`;
                getIO().to(room).emit('order:status', { id: result.movedOrder.id, status: result.movedOrder.status });
                getIO().to(room).emit('table:status', { id: sourceTableId, status: 'AVAILABLE', currentOrderId: null });
                getIO().to(room).emit('table:status', { id: targetTableId, status: 'OCCUPIED', currentOrderId: result.movedOrder.id });
            }
        } catch {
            // socket optional
        }

        return res.json({ success: true, ...result });
    } catch (error: any) {
        return res.status(400).json({ error: error.message || 'TABLE_TRANSFER_FAILED' });
    }
};

export const splitTableOrder = async (req: Request, res: Response) => {
    try {
        const { sourceTableId, targetTableId, items } = req.body || {};
        if (!sourceTableId || !targetTableId) {
            return res.status(400).json({ error: 'SOURCE_TARGET_REQUIRED' });
        }
        if (sourceTableId === targetTableId) {
            return res.status(400).json({ error: 'SOURCE_EQUALS_TARGET' });
        }

        const result = await db.transaction(async (tx) => {
            const sourceOrder = await findActiveOrderByTable(tx as any, String(sourceTableId));
            if (!sourceOrder) throw new Error('SOURCE_ORDER_NOT_FOUND');

            const targetOrder = await findActiveOrderByTable(tx as any, String(targetTableId));
            if (targetOrder) throw new Error('TARGET_TABLE_HAS_ACTIVE_ORDER');

            const pickedItems = await pickItemsToMove(tx as any, sourceOrder.id, Array.isArray(items) ? items : []);
            if (pickedItems.length === 0) throw new Error('NO_ITEMS_SELECTED');

            const newOrderId = `split-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            const [newOrder] = await tx.insert(orders).values({
                id: newOrderId,
                type: sourceOrder.type,
                source: sourceOrder.source,
                branchId: sourceOrder.branchId,
                tableId: String(targetTableId),
                customerId: sourceOrder.customerId,
                customerName: sourceOrder.customerName,
                customerPhone: sourceOrder.customerPhone,
                deliveryAddress: sourceOrder.deliveryAddress,
                isCallCenterOrder: sourceOrder.isCallCenterOrder,
                status: 'PENDING',
                subtotal: 0,
                discount: 0,
                tax: 0,
                deliveryFee: 0,
                serviceCharge: 0,
                total: 0,
                freeDelivery: false,
                isUrgent: sourceOrder.isUrgent,
                notes: sourceOrder.notes,
                syncStatus: sourceOrder.syncStatus || 'SYNCED',
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning();

            for (const item of pickedItems) {
                // reduce quantity/delete from source rows
                const [row] = await tx.select().from(orderItems).where(eq(orderItems.id, item.id)).limit(1);
                if (!row) continue;
                const existingQty = Number(row.quantity || 0);
                const moveQty = Number(item.quantity || 0);
                const nextQty = existingQty - moveQty;
                if (nextQty <= 0) {
                    await tx.delete(orderItems).where(eq(orderItems.id, row.id));
                } else {
                    await tx.update(orderItems).set({ quantity: nextQty }).where(eq(orderItems.id, row.id));
                }

                await tx.insert(orderItems).values({
                    orderId: newOrder.id,
                    menuItemId: item.menuItemId,
                    name: item.name,
                    nameAr: item.nameAr,
                    price: item.price,
                    quantity: moveQty,
                    notes: item.notes,
                    modifiers: item.modifiers as any,
                    status: 'PENDING',
                });
            }

            const updatedSource = await recalcOrderTotals(tx as any, sourceOrder.id);
            const updatedTarget = await recalcOrderTotals(tx as any, newOrder.id);

            await tx.update(tables).set({
                status: 'OCCUPIED',
                currentOrderId: newOrder.id,
                updatedAt: new Date(),
            }).where(eq(tables.id, String(targetTableId)));

            return { sourceOrder: updatedSource, targetOrder: updatedTarget };
        });

        try {
            const branchId = result.sourceOrder?.branchId || result.targetOrder?.branchId;
            if (branchId) {
                const room = `branch:${branchId}`;
                getIO().to(room).emit('table:status', { id: targetTableId, status: 'OCCUPIED', currentOrderId: result.targetOrder?.id });
                if (result.sourceOrder) getIO().to(room).emit('order:status', { id: result.sourceOrder.id, status: result.sourceOrder.status });
                if (result.targetOrder) getIO().to(room).emit('order:created', result.targetOrder);
            }
        } catch {
            // socket optional
        }

        return res.json({ success: true, ...result });
    } catch (error: any) {
        return res.status(400).json({ error: error.message || 'TABLE_SPLIT_FAILED' });
    }
};

export const mergeTableOrders = async (req: Request, res: Response) => {
    try {
        const { sourceTableId, targetTableId, items } = req.body || {};
        if (!sourceTableId || !targetTableId) {
            return res.status(400).json({ error: 'SOURCE_TARGET_REQUIRED' });
        }
        if (sourceTableId === targetTableId) {
            return res.status(400).json({ error: 'SOURCE_EQUALS_TARGET' });
        }

        const result = await db.transaction(async (tx) => {
            const sourceOrder = await findActiveOrderByTable(tx as any, String(sourceTableId));
            if (!sourceOrder) throw new Error('SOURCE_ORDER_NOT_FOUND');

            const targetOrder = await findActiveOrderByTable(tx as any, String(targetTableId));
            if (!targetOrder) throw new Error('TARGET_ORDER_NOT_FOUND');

            const pickedItems = await pickItemsToMove(tx as any, sourceOrder.id, Array.isArray(items) ? items : []);
            if (pickedItems.length === 0) throw new Error('NO_ITEMS_SELECTED');

            for (const item of pickedItems) {
                const [row] = await tx.select().from(orderItems).where(eq(orderItems.id, item.id)).limit(1);
                if (!row) continue;
                const existingQty = Number(row.quantity || 0);
                const moveQty = Number(item.quantity || 0);
                const nextQty = existingQty - moveQty;

                if (nextQty <= 0) {
                    await tx.delete(orderItems).where(eq(orderItems.id, row.id));
                } else {
                    await tx.update(orderItems).set({ quantity: nextQty }).where(eq(orderItems.id, row.id));
                }

                await tx.insert(orderItems).values({
                    orderId: targetOrder.id,
                    menuItemId: item.menuItemId,
                    name: item.name,
                    nameAr: item.nameAr,
                    price: item.price,
                    quantity: moveQty,
                    notes: item.notes,
                    modifiers: item.modifiers as any,
                    status: 'PENDING',
                });
            }

            const updatedSource = await recalcOrderTotals(tx as any, sourceOrder.id);
            const updatedTarget = await recalcOrderTotals(tx as any, targetOrder.id);

            if (!updatedSource || Number(updatedSource.subtotal || 0) <= 0) {
                await tx.update(orders).set({
                    status: 'DELIVERED',
                    completedAt: new Date(),
                    updatedAt: new Date(),
                }).where(eq(orders.id, sourceOrder.id));
                await tx.update(tables).set({
                    status: 'AVAILABLE',
                    currentOrderId: null,
                    updatedAt: new Date(),
                }).where(eq(tables.id, String(sourceTableId)));
            }

            await tx.update(tables).set({
                status: 'OCCUPIED',
                currentOrderId: targetOrder.id,
                updatedAt: new Date(),
            }).where(eq(tables.id, String(targetTableId)));

            const [freshSource] = await tx.select().from(orders).where(eq(orders.id, sourceOrder.id)).limit(1);
            const [freshTarget] = await tx.select().from(orders).where(eq(orders.id, targetOrder.id)).limit(1);
            return { sourceOrder: freshSource, targetOrder: freshTarget };
        });

        try {
            const branchId = result.sourceOrder?.branchId || result.targetOrder?.branchId;
            if (branchId) {
                const room = `branch:${branchId}`;
                if (result.sourceOrder) getIO().to(room).emit('order:status', { id: result.sourceOrder.id, status: result.sourceOrder.status });
                if (result.targetOrder) getIO().to(room).emit('order:status', { id: result.targetOrder.id, status: result.targetOrder.status });
                getIO().to(room).emit('table:status', { id: sourceTableId, status: result.sourceOrder?.status === 'DELIVERED' ? 'AVAILABLE' : 'OCCUPIED', currentOrderId: result.sourceOrder?.status === 'DELIVERED' ? null : result.sourceOrder?.id });
                getIO().to(room).emit('table:status', { id: targetTableId, status: 'OCCUPIED', currentOrderId: result.targetOrder?.id });
            }
        } catch {
            // socket optional
        }

        return res.json({ success: true, ...result });
    } catch (error: any) {
        return res.status(400).json({ error: error.message || 'TABLE_MERGE_FAILED' });
    }
};
