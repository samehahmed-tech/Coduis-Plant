import { Request, Response } from 'express';
import { db } from '../db';
import { orders, orderItems, orderStatusHistory, payments, warehouses, shifts, settings, idempotencyKeys, menuItems } from '../../src/db/schema';
import { eq, and, desc, gte, lte, inArray, gt } from 'drizzle-orm';
import { inventoryService } from '../services/inventoryService';
import { getStringParam } from '../utils/request';
import { getIO } from '../socket';
import { submitOrderToFiscal } from '../services/fiscalSubmitService';
import { postPosOrderEntry } from '../services/financePostingService';
import { buildRequestHash, getIdempotencyKeyFromRequest, sanitizeIdempotencyPayload } from '../services/idempotencyService';
import { evaluateOrderStatusUpdate } from '../services/orderStatusPolicy';

const ORDER_CREATE_SCOPE = 'ORDER_CREATE';
const ORDER_STATUS_UPDATE_SCOPE = 'ORDER_STATUS_UPDATE';
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

type CouponRule = {
    code: string;
    type: 'PERCENT' | 'FIXED';
    value: number;
    active?: boolean;
    minSubtotal?: number;
    maxDiscount?: number;
    branchIds?: string[];
    orderTypes?: string[];
    startAt?: string;
    endAt?: string;
};

const toCouponRules = (raw: unknown): CouponRule[] => {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((item: any): CouponRule => {
            const discountType: 'PERCENT' | 'FIXED' = String(item?.type || 'PERCENT').toUpperCase() === 'FIXED' ? 'FIXED' : 'PERCENT';
            return {
            code: String(item?.code || '').trim().toUpperCase(),
            type: discountType,
            value: Number(item?.value || 0),
            active: item?.active !== false,
            minSubtotal: item?.minSubtotal !== undefined ? Number(item.minSubtotal) : undefined,
            maxDiscount: item?.maxDiscount !== undefined ? Number(item.maxDiscount) : undefined,
            branchIds: Array.isArray(item?.branchIds) ? item.branchIds.map((v: any) => String(v)) : undefined,
            orderTypes: Array.isArray(item?.orderTypes) ? item.orderTypes.map((v: any) => String(v).toUpperCase()) : undefined,
            startAt: item?.startAt ? String(item.startAt) : undefined,
            endAt: item?.endAt ? String(item.endAt) : undefined,
            };
        })
        .filter((c) => Boolean(c.code) && Number(c.value) > 0);
};

export const validateCoupon = async (req: Request, res: Response) => {
    try {
        const { code, branchId, orderType, subtotal, customerId } = req.body || {};
        const normalizedCode = String(code || '').trim().toUpperCase();
        const orderTypeValue = String(orderType || '').trim().toUpperCase();
        const subtotalValue = Number(subtotal || 0);

        if (!normalizedCode) {
            return res.status(400).json({ valid: false, message: 'COUPON_CODE_REQUIRED' });
        }
        if (!orderTypeValue) {
            return res.status(400).json({ valid: false, message: 'ORDER_TYPE_REQUIRED' });
        }
        if (subtotalValue <= 0) {
            return res.status(400).json({ valid: false, message: 'SUBTOTAL_REQUIRED' });
        }

        const [couponSetting] = await db
            .select()
            .from(settings)
            .where(eq(settings.key, 'posCoupons'))
            .limit(1);

        const coupons = toCouponRules(couponSetting?.value);
        if (coupons.length === 0) {
            return res.status(404).json({ valid: false, message: 'NO_COUPONS_CONFIGURED' });
        }

        const coupon = coupons.find((c) => c.code === normalizedCode);
        if (!coupon) {
            return res.status(404).json({ valid: false, message: 'COUPON_NOT_FOUND' });
        }
        if (coupon.active === false) {
            return res.status(400).json({ valid: false, message: 'COUPON_INACTIVE' });
        }
        if (coupon.minSubtotal !== undefined && subtotalValue < coupon.minSubtotal) {
            return res.status(400).json({ valid: false, message: 'MIN_SUBTOTAL_NOT_MET' });
        }
        if (coupon.branchIds && coupon.branchIds.length > 0 && branchId && !coupon.branchIds.includes(String(branchId))) {
            return res.status(400).json({ valid: false, message: 'COUPON_NOT_ALLOWED_FOR_BRANCH' });
        }
        if (coupon.orderTypes && coupon.orderTypes.length > 0 && !coupon.orderTypes.includes(orderTypeValue)) {
            return res.status(400).json({ valid: false, message: 'COUPON_NOT_ALLOWED_FOR_ORDER_TYPE' });
        }

        const now = Date.now();
        if (coupon.startAt) {
            const start = new Date(coupon.startAt).getTime();
            if (!Number.isNaN(start) && now < start) {
                return res.status(400).json({ valid: false, message: 'COUPON_NOT_STARTED' });
            }
        }
        if (coupon.endAt) {
            const end = new Date(coupon.endAt).getTime();
            if (!Number.isNaN(end) && now > end) {
                return res.status(400).json({ valid: false, message: 'COUPON_EXPIRED' });
            }
        }

        let discountAmount = coupon.type === 'PERCENT'
            ? (subtotalValue * coupon.value) / 100
            : coupon.value;
        if (coupon.maxDiscount !== undefined) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }
        discountAmount = Math.max(0, Math.min(discountAmount, subtotalValue));

        const discountPercent = subtotalValue > 0 ? (discountAmount / subtotalValue) * 100 : 0;

        return res.json({
            valid: true,
            code: normalizedCode,
            customerId: customerId || null,
            discountType: coupon.type,
            discountValue: coupon.value,
            discountAmount: Number(discountAmount.toFixed(2)),
            discountPercent: Number(discountPercent.toFixed(4)),
            message: 'COUPON_VALID',
        });
    } catch (error: any) {
        return res.status(500).json({ valid: false, message: error.message || 'COUPON_VALIDATION_FAILED' });
    }
};

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const { status, branch_id, type, date, limit } = req.query;
        const conditions = [];

        if (status) conditions.push(eq(orders.status, status as string));
        if (branch_id) conditions.push(eq(orders.branchId, branch_id as string));
        if (type) conditions.push(eq(orders.type, type as string));

        if (date) {
            const start = new Date(date as string);
            const end = new Date(date as string);
            end.setHours(23, 59, 59, 999);
            conditions.push(gte(orders.createdAt, start));
            conditions.push(lte(orders.createdAt, end));
        }

        const max = Math.min(Number(limit) || 100, 500);
        let query = db.select().from(orders);
        if (conditions.length > 0) {
            // @ts-ignore
            query = query.where(and(...conditions));
        }

        const allOrders = await query.orderBy(desc(orders.createdAt)).limit(max);

        if (allOrders.length === 0) {
            return res.json([]);
        }

        const orderIds = allOrders.map((o) => o.id);
        const allOrderItems = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
        const menuItemIds = Array.from(
            new Set(
                allOrderItems
                    .map((item) => item.menuItemId)
                    .filter((id): id is string => Boolean(id)),
            ),
        );
        const menuItemsById = new Map<string, { id: string; categoryId: string | null; printerIds: string[] | null }>();
        if (menuItemIds.length > 0) {
            const relatedMenuItems = await db
                .select({
                    id: menuItems.id,
                    categoryId: menuItems.categoryId,
                    printerIds: menuItems.printerIds,
                })
                .from(menuItems)
                .where(inArray(menuItems.id, menuItemIds));
            for (const mi of relatedMenuItems) {
                menuItemsById.set(mi.id, mi);
            }
        }
        const itemsByOrderId = new Map<string, any[]>();
        for (const item of allOrderItems) {
            const menuMeta = item.menuItemId ? menuItemsById.get(item.menuItemId) : undefined;
            const bucket = itemsByOrderId.get(item.orderId) || [];
            bucket.push({
                id: item.menuItemId,
                menu_item_id: item.menuItemId,
                menuItemId: item.menuItemId,
                name: item.name,
                categoryId: menuMeta?.categoryId || null,
                printerIds: menuMeta?.printerIds || [],
                price: item.price,
                quantity: item.quantity,
                notes: item.notes,
                modifiers: item.modifiers,
                selectedModifiers: item.modifiers || [],
            });
            itemsByOrderId.set(item.orderId, bucket);
        }

        const enrichedOrders = allOrders.map((order) => ({
            ...order,
            items: itemsByOrderId.get(order.id) || [],
        }));
        res.json(enrichedOrders);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createOrder = async (req: Request, res: Response) => {
    const idempotencyKey = getIdempotencyKeyFromRequest(req);
    const idempotencyHash = idempotencyKey
        ? buildRequestHash(sanitizeIdempotencyPayload(req.body))
        : undefined;
    const idempotencyExpiry = new Date(Date.now() + IDEMPOTENCY_TTL_MS);

    const replayIdempotentResponse = async () => {
        if (!idempotencyKey || !idempotencyHash) return null;
        const [existingClaim] = await db
            .select()
            .from(idempotencyKeys)
            .where(
                and(
                    eq(idempotencyKeys.key, idempotencyKey),
                    eq(idempotencyKeys.scope, ORDER_CREATE_SCOPE),
                    gt(idempotencyKeys.expiresAt, new Date()),
                ),
            )
            .limit(1);

        if (!existingClaim) return null;
        if (existingClaim.requestHash !== idempotencyHash) {
            return res.status(409).json({
                error: 'IDEMPOTENCY_KEY_PAYLOAD_CONFLICT',
                message: 'This Idempotency-Key was used with a different payload.',
            });
        }

        if (existingClaim.responseBody) {
            return res.status(existingClaim.responseCode || 200).json(existingClaim.responseBody);
        }

        if (existingClaim.resourceId) {
            const [existingOrder] = await db.select().from(orders).where(eq(orders.id, existingClaim.resourceId)).limit(1);
            if (existingOrder) {
                return res.status(existingClaim.responseCode || 200).json(existingOrder);
            }
        }

        return res.status(409).json({
            error: 'IDEMPOTENCY_KEY_IN_PROGRESS',
            message: 'Request with this Idempotency-Key is still being processed.',
        });
    };

    const clearIdempotencyClaim = async () => {
        if (!idempotencyKey) return;
        await db.delete(idempotencyKeys).where(
            and(
                eq(idempotencyKeys.key, idempotencyKey),
                eq(idempotencyKeys.scope, ORDER_CREATE_SCOPE),
            ),
        );
    };

    try {
        const { items, userId, ...bodyData } = req.body;

        if (idempotencyKey && idempotencyHash) {
            const replay = await replayIdempotentResponse();
            if (replay) return replay;

            const inserted = await db
                .insert(idempotencyKeys)
                .values({
                    key: idempotencyKey,
                    scope: ORDER_CREATE_SCOPE,
                    requestHash: idempotencyHash,
                    status: 'IN_PROGRESS',
                    expiresAt: idempotencyExpiry,
                    updatedAt: new Date(),
                })
                .onConflictDoNothing({
                    target: [idempotencyKeys.key, idempotencyKeys.scope],
                })
                .returning({ id: idempotencyKeys.id });

            if (inserted.length === 0) {
                const replay = await replayIdempotentResponse();
                if (replay) return replay;
            }
        }

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

        // Idempotency guard: if client retries the same order id, return existing record.
        if (orderData.id) {
            const [existingOrder] = await db.select().from(orders).where(eq(orders.id, orderData.id)).limit(1);
            if (existingOrder) {
                if (idempotencyKey) {
                    await db
                        .update(idempotencyKeys)
                        .set({
                            status: 'COMPLETED',
                            responseCode: 200,
                            resourceId: existingOrder.id,
                            responseBody: existingOrder,
                            updatedAt: new Date(),
                            expiresAt: idempotencyExpiry,
                        })
                        .where(
                            and(
                                eq(idempotencyKeys.key, idempotencyKey),
                                eq(idempotencyKeys.scope, ORDER_CREATE_SCOPE),
                            ),
                        );
                }
                return res.status(200).json(existingOrder);
            }
        }

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
            await clearIdempotencyClaim();
            return res.status(400).json({
                error: 'SHIFT_REQUIRED',
                message: 'No active shift found. Please open a shift before placing orders.'
            });
        }
        // =============================================================

        const { savedOrder, paidNow } = await db.transaction(async (tx) => {
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

            // 5. Payments (if provided)
            const rawPayments = Array.isArray(bodyData.payments) ? bodyData.payments : [];
            const fallbackPayment = (orderData.paymentMethod && (orderData.paidAmount || orderData.total))
                ? [{ method: orderData.paymentMethod, amount: orderData.paidAmount || orderData.total }]
                : [];
            const paymentsToInsert = rawPayments.length > 0 ? rawPayments : fallbackPayment;

            for (let idx = 0; idx < paymentsToInsert.length; idx += 1) {
                const p = paymentsToInsert[idx];
                if (!p?.method || p?.amount === undefined) continue;
                const paymentId = p.id || p.paymentId || `PAY-${newOrder.id}-${idx + 1}`;
                const [existingPayment] = await tx.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
                if (existingPayment) continue;
                await tx.insert(payments).values({
                    id: paymentId,
                    orderId: newOrder.id,
                    method: p.method,
                    amount: Number(p.amount),
                    referenceNumber: p.referenceNumber || p.reference_number,
                    status: 'COMPLETED',
                    processedBy: userId || orderData.callCenterAgentId || 'system',
                    createdAt: new Date(),
                });
            }

            const paidNow = Boolean(orderData.isPaid) || paymentsToInsert.length > 0;
            return { savedOrder: newOrder, paidNow };
        });

        try {
            const branchRoom = savedOrder.branchId ? `branch:${savedOrder.branchId}` : null;
            if (branchRoom) {
                getIO().to(branchRoom).emit('order:created', savedOrder);
            }
        } catch {
            // socket is optional
        }

        // Finance posting: POS sale journal entry (non-blocking)
        postPosOrderEntry({
            orderId: savedOrder.id,
            amount: Number(savedOrder.total || 0),
            branchId: savedOrder.branchId,
            userId: userId || savedOrder.callCenterAgentId || 'system',
        }).catch(() => {
            // Keep order flow resilient even if finance posting fails
        });

        if (paidNow) {
            setTimeout(() => {
                submitOrderToFiscal(savedOrder.id).catch(() => {
                    // background submission; errors are stored in fiscal logs
                });
            }, 0);
        }

        if (idempotencyKey) {
            await db
                .update(idempotencyKeys)
                .set({
                    status: 'COMPLETED',
                    responseCode: 201,
                    resourceId: savedOrder.id,
                    responseBody: savedOrder,
                    updatedAt: new Date(),
                    expiresAt: idempotencyExpiry,
                })
                .where(
                    and(
                        eq(idempotencyKeys.key, idempotencyKey),
                        eq(idempotencyKeys.scope, ORDER_CREATE_SCOPE),
                    ),
                );
        }

        res.status(201).json(savedOrder);
    } catch (error: any) {
        await clearIdempotencyClaim();
        res.status(500).json({ error: error.message });
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    const idempotencyKey = getIdempotencyKeyFromRequest(req);
    const idempotencyHash = idempotencyKey
        ? buildRequestHash(sanitizeIdempotencyPayload({
            orderId: getStringParam((req.params as any).id),
            ...req.body,
        }))
        : undefined;
    const idempotencyExpiry = new Date(Date.now() + IDEMPOTENCY_TTL_MS);

    const replayIdempotentResponse = async () => {
        if (!idempotencyKey || !idempotencyHash) return null;
        const [existingClaim] = await db
            .select()
            .from(idempotencyKeys)
            .where(
                and(
                    eq(idempotencyKeys.key, idempotencyKey),
                    eq(idempotencyKeys.scope, ORDER_STATUS_UPDATE_SCOPE),
                    gt(idempotencyKeys.expiresAt, new Date()),
                ),
            )
            .limit(1);

        if (!existingClaim) return null;
        if (existingClaim.requestHash !== idempotencyHash) {
            return res.status(409).json({
                error: 'IDEMPOTENCY_KEY_PAYLOAD_CONFLICT',
                message: 'This Idempotency-Key was used with a different payload.',
            });
        }

        if (existingClaim.responseBody) {
            return res.status(existingClaim.responseCode || 200).json(existingClaim.responseBody);
        }

        if (existingClaim.resourceId) {
            const [existingOrder] = await db.select().from(orders).where(eq(orders.id, existingClaim.resourceId)).limit(1);
            if (existingOrder) {
                return res.status(existingClaim.responseCode || 200).json(existingOrder);
            }
        }

        return res.status(409).json({
            error: 'IDEMPOTENCY_KEY_IN_PROGRESS',
            message: 'Request with this Idempotency-Key is still being processed.',
        });
    };

    const clearIdempotencyClaim = async () => {
        if (!idempotencyKey) return;
        await db.delete(idempotencyKeys).where(
            and(
                eq(idempotencyKeys.key, idempotencyKey),
                eq(idempotencyKeys.scope, ORDER_STATUS_UPDATE_SCOPE),
            ),
        );
    };

    try {
        const { status, changed_by, notes } = req.body;
        const expectedUpdatedAtRaw = req.body?.expected_updated_at || req.body?.expectedUpdatedAt;
        const nextStatus = String(status || '').toUpperCase();
        const orderId = getStringParam((req.params as any).id);
        if (!orderId) return res.status(400).json({ error: 'ORDER_ID_REQUIRED' });

        if (idempotencyKey && idempotencyHash) {
            const replay = await replayIdempotentResponse();
            if (replay) return replay;

            const inserted = await db
                .insert(idempotencyKeys)
                .values({
                    key: idempotencyKey,
                    scope: ORDER_STATUS_UPDATE_SCOPE,
                    requestHash: idempotencyHash,
                    status: 'IN_PROGRESS',
                    expiresAt: idempotencyExpiry,
                    updatedAt: new Date(),
                })
                .onConflictDoNothing({
                    target: [idempotencyKeys.key, idempotencyKeys.scope],
                })
                .returning({ id: idempotencyKeys.id });

            if (inserted.length === 0) {
                const replay = await replayIdempotentResponse();
                if (replay) return replay;
            }
        }

        const result = await db.transaction(async (tx) => {
            const [currentOrder] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
            if (!currentOrder) throw new Error('Order not found');

            const statusPolicy = evaluateOrderStatusUpdate({
                currentStatus: String(currentOrder.status || ''),
                nextStatus,
                notes,
                userRole: req.user?.role,
                userBranchId: req.user?.branchId,
                orderBranchId: currentOrder.branchId,
            });
            if (!statusPolicy.ok) {
                const policyCode = statusPolicy.code || 'INVALID_STATUS_TRANSITION';
                const policyError: any = new Error(policyCode);
                policyError.status = policyCode === 'FORBIDDEN_BRANCH_SCOPE' || policyCode === 'STATUS_TRANSITION_FORBIDDEN' ? 403 : 400;
                throw policyError;
            }

            if (expectedUpdatedAtRaw && currentOrder.updatedAt) {
                const expected = new Date(expectedUpdatedAtRaw).getTime();
                const actual = new Date(currentOrder.updatedAt).getTime();
                if (!Number.isNaN(expected) && expected !== actual) {
                    const conflict: any = new Error('ORDER_VERSION_CONFLICT');
                    conflict.status = 409;
                    conflict.currentUpdatedAt = currentOrder.updatedAt;
                    throw conflict;
                }
            }

            // Idempotent status update: avoid duplicate history rows on retries.
            if (String(currentOrder.status) === String(status)) {
                return currentOrder;
            }

            const [updatedOrder] = await tx.update(orders)
                .set({ status: nextStatus, updatedAt: new Date() })
                .where(eq(orders.id, orderId))
                .returning();
            if (!updatedOrder) throw new Error('Order not found');

            await tx.insert(orderStatusHistory).values({
                orderId,
                status: nextStatus,
                changedBy: changed_by,
                notes,
                createdAt: new Date(),
            });

            return updatedOrder;
        });

        if (idempotencyKey) {
            await db
                .update(idempotencyKeys)
                .set({
                    status: 'COMPLETED',
                    responseCode: 200,
                    resourceId: result.id,
                    responseBody: result,
                    updatedAt: new Date(),
                    expiresAt: idempotencyExpiry,
                })
                .where(
                    and(
                        eq(idempotencyKeys.key, idempotencyKey),
                        eq(idempotencyKeys.scope, ORDER_STATUS_UPDATE_SCOPE),
                    ),
                );
        }

        try {
            const branchRoom = result.branchId ? `branch:${result.branchId}` : null;
            if (branchRoom) {
                getIO().to(branchRoom).emit('order:status', { id: result.id, status: result.status });
            }
        } catch {
            // socket is optional
        }

        if (['DELIVERED', 'COMPLETED'].includes(String(result.status))) {
            setTimeout(() => {
                submitOrderToFiscal(result.id).catch(() => {
                    // background submission; errors are stored in fiscal logs
                });
            }, 0);
        }

        res.json(result);
    } catch (error: any) {
        await clearIdempotencyClaim();
        const statusCode = Number(error?.status) || 500;
        if (statusCode === 409) {
            return res.status(409).json({
                error: error.message,
                currentUpdatedAt: error.currentUpdatedAt
            });
        }
        if (statusCode === 403 || statusCode === 400) {
            return res.status(statusCode).json({ error: error.message });
        }
        res.status(statusCode).json({ error: error.message });
    }
};
