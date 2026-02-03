import { Request, Response } from 'express';
import { db } from '../db';
import { orders, orderItems, orderStatusHistory, inventoryStock, stockMovements, menuItems, warehouses, shifts } from '../../src/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { inventoryService } from '../services/inventoryService';

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100);
        res.json(allOrders);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createOrder = async (req: Request, res: Response) => {
    try {
        const { items, userId, ...orderData } = req.body;

        // ================== SHIFT-LOCK ENFORCEMENT ==================
        // Every order MUST be linked to an active shift for cash reconciliation
        const [activeShift] = await db.select().from(shifts).where(
            and(
                eq(shifts.branchId, orderData.branchId),
                eq(shifts.status, 'OPEN')
            )
        );

        if (!activeShift) {
            return res.status(400).json({
                error: 'SHIFT_REQUIRED',
                message: 'No active shift found. Please open a shift before placing orders.'
            });
        }
        // =============================================================

        const savedOrder = await db.transaction(async (tx) => {
            // 1. Calculate and Enforce Totals (Egyptian Standards)
            const subtotal = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
            const discountAmount = orderData.discount || 0;
            const netAmount = subtotal - discountAmount;

            // Standard 14% VAT for Egypt
            const tax = orderData.tax !== undefined ? orderData.tax : parseFloat((netAmount * 0.14).toFixed(2));

            // Standard 12% Service Charge for Dine-In in many Egyptian venues (Optional, but good for foundation)
            const serviceCharge = orderData.type === 'DINE_IN' ? (orderData.service_charge || 0) : 0;

            const total = netAmount + tax + serviceCharge + (orderData.delivery_fee || 0);

            const [newOrder] = await tx.insert(orders).values({
                ...orderData,
                subtotal,
                discount: discountAmount,
                tax,
                serviceCharge: serviceCharge,
                total,
                shiftId: activeShift.id, // Link order to shift
                createdAt: new Date(),
                updatedAt: new Date(),
            }).returning();

            // 2. Find a warehouse for this branch to deduct from (Kitchen preferred)
            const [warehouse] = await tx.select({ id: warehouses.id })
                .from(warehouses)
                .where(eq(warehouses.branchId, newOrder.branchId))
                .orderBy(desc(warehouses.type))
                .limit(1);

            // 3. Insert Order Items and Deduct Inventory
            for (const item of items) {
                await tx.insert(orderItems).values({
                    orderId: newOrder.id,
                    menuItemId: item.menu_item_id || item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    notes: item.notes,
                    modifiers: item.modifiers,
                });

                if (warehouse) {
                    await inventoryService.deductIngredients(
                        tx,
                        item.menu_item_id || item.id,
                        item.quantity,
                        warehouse.id,
                        newOrder.id,
                        newOrder.callCenterAgentId || 'system'
                    );
                }
            }

            // 4. Status History
            await tx.insert(orderStatusHistory).values({
                orderId: newOrder.id,
                status: newOrder.status || 'PENDING',
                createdAt: new Date(),
            });

            return newOrder;
        });

        res.status(201).json(savedOrder);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { status, changed_by, notes } = req.body;
        const orderId = req.params.id;

        const result = await db.transaction(async (tx) => {
            const [updatedOrder] = await tx.update(orders)
                .set({ status, updatedAt: new Date() })
                .where(eq(orders.id, orderId))
                .returning();

            if (!updatedOrder) throw new Error('Order not found');

            await tx.insert(orderStatusHistory).values({
                orderId,
                status,
                changedBy: changed_by,
                notes,
                createdAt: new Date(),
            });

            return updatedOrder;
        });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
