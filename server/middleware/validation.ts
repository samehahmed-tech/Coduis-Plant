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
    cartId: z.string().min(1),
    quantity: z.number().int().min(1).max(999),
    notes: z.string().max(500).optional(),
    selectedModifiers: z.array(z.object({
        groupName: z.string(),
        optionName: z.string(),
        price: z.number().min(0),
    })).optional().default([]),
});

export const createOrderSchema = z.object({
    type: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY', 'PICKUP']),
    branchId: z.string().min(1, 'Branch ID is required'),
    items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
    tableId: z.string().optional(),
    customerId: z.string().optional(),
    customerName: z.string().max(200).optional(),
    customerPhone: z.string().max(20).optional(),
    deliveryAddress: z.string().max(500).optional(),
    notes: z.string().max(1000).optional(),
    kitchenNotes: z.string().max(1000).optional(),
    deliveryNotes: z.string().max(1000).optional(),
    discount: z.number().min(0).max(100).optional(),
    freeDelivery: z.boolean().optional(),
    isUrgent: z.boolean().optional(),
    isCallCenterOrder: z.boolean().optional(),
    paymentMethod: z.enum(['CASH', 'VISA', 'VODAFONE_CASH', 'INSTAPAY', 'SPLIT']).optional(),
    payments: z.array(z.object({
        method: z.enum(['CASH', 'VISA', 'VODAFONE_CASH', 'INSTAPAY', 'SPLIT']),
        amount: z.number().min(0),
    })).optional(),
    couponCode: z.string().max(50).optional(),
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
