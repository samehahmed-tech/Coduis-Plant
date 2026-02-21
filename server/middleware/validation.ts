/**
 * Zod Request Validation Schemas
 * Centralised validation for critical API endpoints.
 */

import { z } from 'zod';

// ============================================================================
// Auth Schemas
// ============================================================================

export const loginSchema = z.object({
    email: z.string().email('Valid email is required').max(255),
    password: z.string().min(1, 'Password is required').max(128),
    deviceName: z.string().max(100).optional(),
});

export const pinLoginSchema = z.object({
    pin: z.string().min(4).max(6).regex(/^\d+$/, 'PIN must be numeric'),
    branchId: z.string().uuid().optional(),
    deviceName: z.string().max(100).optional(),
});

export const mfaVerifySchema = z.object({
    mfaToken: z.string().min(1, 'MFA token is required'),
    code: z.string().min(4).max(8, 'MFA code must be 4-8 characters'),
    deviceName: z.string().max(100).optional(),
});

export const setupPinSchema = z.object({
    pin: z.string().min(4).max(6).regex(/^\d+$/, 'PIN must be numeric'),
    currentPassword: z.string().optional(),
});

// ============================================================================
// Order Schemas
// ============================================================================

const orderItemSchema = z.object({
    menu_item_id: z.string().min(1),
    name: z.string().optional(),
    price: z.number().min(0).optional(),
    quantity: z.number().int().min(1).max(999),
    notes: z.string().max(500).optional().nullable(),
    modifiers: z.array(z.object({
        groupName: z.string(),
        optionName: z.string(),
        price: z.number().min(0),
    })).optional().default([]),
    // Legacy compat — accept cartId/selectedModifiers too
    cartId: z.string().optional(),
    selectedModifiers: z.array(z.any()).optional(),
});

export const createOrderSchema = z.object({
    id: z.string().optional(),
    type: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY', 'PICKUP']),
    source: z.string().max(50).optional(),
    branchId: z.string().min(1).optional(),
    branch_id: z.string().min(1).optional(),
    items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
    tableId: z.string().optional().nullable(),
    table_id: z.string().optional().nullable(),
    customerId: z.string().optional().nullable(),
    customer_id: z.string().optional().nullable(),
    customerName: z.string().max(200).optional().nullable(),
    customer_name: z.string().max(200).optional().nullable(),
    customerPhone: z.string().max(20).optional().nullable(),
    customer_phone: z.string().max(20).optional().nullable(),
    deliveryAddress: z.string().max(500).optional().nullable(),
    delivery_address: z.string().max(500).optional().nullable(),
    notes: z.string().max(1000).optional().nullable(),
    kitchenNotes: z.string().max(1000).optional().nullable(),
    kitchen_notes: z.string().max(1000).optional().nullable(),
    deliveryNotes: z.string().max(1000).optional().nullable(),
    delivery_notes: z.string().max(1000).optional().nullable(),
    status: z.string().optional(),
    subtotal: z.number().min(0).optional(),
    discount: z.number().min(0).max(100).optional().nullable(),
    tax: z.number().min(0).optional(),
    total: z.number().min(0).optional(),
    freeDelivery: z.boolean().optional().nullable(),
    free_delivery: z.boolean().optional().nullable(),
    isUrgent: z.boolean().optional().nullable(),
    is_urgent: z.boolean().optional().nullable(),
    isCallCenterOrder: z.boolean().optional().nullable(),
    is_call_center_order: z.boolean().optional().nullable(),
    paymentMethod: z.enum(['CASH', 'VISA', 'VODAFONE_CASH', 'INSTAPAY', 'SPLIT']).optional().nullable(),
    payment_method: z.enum(['CASH', 'VISA', 'VODAFONE_CASH', 'INSTAPAY', 'SPLIT']).optional().nullable(),
    payments: z.array(z.object({
        method: z.enum(['CASH', 'VISA', 'VODAFONE_CASH', 'INSTAPAY', 'SPLIT']),
        amount: z.number().min(0),
    })).optional(),
    couponCode: z.string().max(50).optional().nullable(),
}).refine(data => data.branchId || data.branch_id, {
    message: 'Branch ID is required (branchId or branch_id)',
});

export const updateOrderStatusSchema = z.object({
    status: z.enum(['PENDING', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
    changed_by: z.string().optional(),
    notes: z.string().max(1000).optional(),
    expected_updated_at: z.string().optional(),
    expectedUpdatedAt: z.string().optional(),
    cancellationReason: z.string().max(500).optional(),
});

// ============================================================================
// Inventory Schemas
// ============================================================================

export const stockUpdateSchema = z.object({
    item_id: z.string().min(1),
    warehouse_id: z.string().min(1),
    quantity: z.number(),
    type: z.enum(['TRANSFER', 'ADJUSTMENT', 'PURCHASE', 'SALE_CONSUMPTION', 'WASTE']),
    reason: z.string().max(500).optional(),
    actor_id: z.string().optional(),
    reference_id: z.string().optional(),
});

export const stockTransferSchema = z.object({
    item_id: z.string().min(1),
    from_warehouse_id: z.string().min(1),
    to_warehouse_id: z.string().min(1),
    quantity: z.number().positive('Quantity must be positive'),
    reason: z.string().max(500).optional(),
    actor_id: z.string().optional(),
    reference_id: z.string().optional(),
});

// ============================================================================
// Settings Schemas
// ============================================================================

export const updateSettingSchema = z.object({
    value: z.any(),
    category: z.string().max(100).optional(),
    updated_by: z.string().optional(),
});

// ============================================================================
// User Schemas
// ============================================================================

export const createUserSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    email: z.string().email('Valid email is required').max(255),
    role: z.string().min(1),
    permissions: z.array(z.string()).optional().default([]),
    assignedBranchId: z.string().optional(),
    isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = createUserSchema.partial();

// ============================================================================
// Finance Schemas
// ============================================================================

export const createJournalSchema = z.object({
    description: z.string().min(1, 'Description is required').max(500),
    amount: z.number().positive('Amount must be positive'),
    debitAccountCode: z.string().min(1),
    creditAccountCode: z.string().min(1),
    referenceId: z.string().optional(),
    source: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});

// ============================================================================
// Refund Schemas
// ============================================================================

export const createRefundSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    type: z.enum(['FULL', 'PARTIAL', 'ITEM']),
    reason: z.string().min(1, 'Reason is required').max(1000),
    amount: z.number().min(0).optional(),
    items: z.array(z.object({
        cartId: z.string(),
        quantity: z.number().int().min(1),
        reason: z.string().optional(),
    })).optional(),
    approvedBy: z.string().optional(),
    notes: z.string().max(1000).optional(),
});
