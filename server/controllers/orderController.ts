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
        const { items, userId, ...bodyData } = req.body;

        // Map incoming snake_case to schema's camelCase
        const orderData = {
            id: bodyData.id,
            orderNumber: bodyData.order_number,
            type: bodyData.type,
            source: bodyData.source,
            branchId: bodyData.branch_id || bodyData.branchId, // Handle both
            tableId: bodyData.table_id || bodyData.tableId,
            customerId: bodyData.customer_id || bodyData.customerId,
            customerName: bodyData.customer_name || bodyData.customerName,
            customerPhone: bodyData.customer_phone || bodyData.customerPhone,
            deliveryAddress: bodyData.delivery_address || bodyData.deliveryAddress,
            isCallCenterOrder: bodyData.is_call_center_order || bodyData.isCallCenterOrder,
            callCenterAgentId: bodyData.call_center_agent_id || bodyData.callCenterAgentId,
            status: bodyData.status,
            subtotal: bodyData.subtotal,
            discount: bodyData.discount,
            discountType: bodyData.discount_type || bodyData.discountType,
            discountReason: bodyData.discount_reason || bodyData.discountReason,
            tax: bodyData.tax,
            deliveryFee: bodyData.delivery_fee || bodyData.deliveryFee,
            serviceCharge: bodyData.service_charge || bodyData.serviceCharge,
            total: bodyData.total,
            freeDelivery: bodyData.free_delivery || bodyData.freeDelivery,
            isUrgent: bodyData.is_urgent || bodyData.isUrgent,
            isPaid: bodyData.is_paid || bodyData.isPaid,
            paymentMethod: bodyData.payment_method || bodyData.paymentMethod,
            paidAmount: bodyData.paid_amount || bodyData.paidAmount,
            changeAmount: bodyData.change_amount || bodyData.changeAmount,
            notes: bodyData.notes,
            kitchenNotes: bodyData.kitchen_notes || bodyData.kitchenNotes,
            deliveryNotes: bodyData.delivery_notes || bodyData.deliveryNotes,
            driverId: bodyData.driver_id || bodyData.driverId,
            syncStatus: bodyData.sync_status || bodyData.syncStatus
        };

        // ================== SHIFT-LOCK ENFORCEMENT ==================
        // Every order MUST be linked to an active shift for cash reconciliation
        // Now using the correctly mapped branchId
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
            // Use values from mapped orderData or fallback to bodyData if needed (though mapped should be enough)
            const subtotal = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
            const discountAmount = orderData.discount || 0;
            const netAmount = subtotal - discountAmount;

            // Standard 14% VAT for Egypt
            // If tax wasn't provided, calculate it.
            const tax = orderData.tax !== undefined ? orderData.tax : parseFloat((netAmount * 0.14).toFixed(2));

            // Standard 12% Service Charge for Dine-In
            const serviceCharge = orderData.type === 'DINE_IN' ? (orderData.serviceCharge || 0) : 0;

            const total = netAmount + tax + serviceCharge + (orderData.deliveryFee || 0);

            const [newOrder] = await tx.insert(orders).values({
                ...orderData,
                subtotal, // Recalculated/Verified subtotal
                discount: discountAmount,
                tax,
                serviceCharge: serviceCharge,
                total,    // Recalculated/Verified total
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
                    menuItemId: item.menu_item_id || item.id, // Handle camel/snake or different front-end keys
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
