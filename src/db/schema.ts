// Database Schema for RestoFlow ERP
// Using Drizzle ORM with PostgreSQL

import {
    pgTable,
    serial,
    text,
    timestamp,
    boolean,
    integer,
    real,
    json,
    uuid,
    varchar
} from 'drizzle-orm/pg-core';

// ============================================================================
// 👤 USERS & AUTHENTICATION
// ============================================================================

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').unique().notNull(),
    passwordHash: text('password_hash'),
    role: text('role').notNull(), // SUPER_ADMIN, BRANCH_MANAGER, CASHIER, CALL_CENTER, etc.
    permissions: json('permissions').$type<string[]>().default([]),
    assignedBranchId: text('assigned_branch_id'),
    isActive: boolean('is_active').default(true),
    managerPin: text('manager_pin'), // 4-digit PIN for manager overrides
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// 🏪 BRANCHES
// ============================================================================

export const branches = pgTable('branches', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    nameAr: text('name_ar'),
    location: text('location'),
    address: text('address'),
    phone: text('phone'),
    email: text('email'),
    isActive: boolean('is_active').default(true),
    timezone: text('timezone').default('Africa/Cairo'),
    currency: text('currency').default('EGP'),
    taxRate: real('tax_rate').default(14),
    serviceCharge: real('service_charge').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// 👥 CUSTOMERS (CRM)
// ============================================================================

export const customers = pgTable('customers', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    phone: varchar('phone', { length: 20 }).unique().notNull(),
    email: text('email'),
    // Address Details
    address: text('address'),
    area: text('area'),
    building: text('building'),
    floor: text('floor'),
    apartment: text('apartment'),
    landmark: text('landmark'),
    // Customer Notes
    notes: text('notes'),
    // Loyalty & Stats
    visits: integer('visits').default(0),
    totalSpent: real('total_spent').default(0),
    loyaltyTier: text('loyalty_tier').default('Bronze'), // Bronze, Silver, Gold, Platinum
    loyaltyPoints: integer('loyalty_points').default(0),
    // Metadata
    source: text('source').default('call_center'), // call_center, pos, online, app
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Customer Addresses (Multiple per customer)
export const customerAddresses = pgTable('customer_addresses', {
    id: serial('id').primaryKey(),
    customerId: text('customer_id').references(() => customers.id).notNull(),
    label: text('label').notNull(), // Home, Work, etc.
    address: text('address').notNull(),
    area: text('area'),
    building: text('building'),
    floor: text('floor'),
    apartment: text('apartment'),
    landmark: text('landmark'),
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// 🍽️ MENU MANAGEMENT
// ============================================================================

export const menuCategories = pgTable('menu_categories', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    nameAr: text('name_ar'),
    description: text('description'),
    icon: text('icon'),
    image: text('image'),
    color: text('color'),
    sortOrder: integer('sort_order').default(0),
    isActive: boolean('is_active').default(true),
    targetOrderTypes: json('target_order_types').$type<string[]>().default([]),
    menuIds: json('menu_ids').$type<string[]>().default(['menu-1']),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const menuItems = pgTable('menu_items', {
    id: text('id').primaryKey(),
    categoryId: text('category_id').references(() => menuCategories.id),
    name: text('name').notNull(),
    nameAr: text('name_ar'),
    description: text('description'),
    descriptionAr: text('description_ar'),
    price: real('price').notNull(),
    cost: real('cost').default(0), // Cost price for profit calculation
    image: text('image'),
    // Availability
    isAvailable: boolean('is_available').default(true),
    availableFrom: text('available_from'), // Time: "09:00"
    availableTo: text('available_to'), // Time: "22:00"
    availableDays: json('available_days').$type<string[]>(), // ["mon", "tue", ...]
    modifierGroups: json('modifier_groups').$type<any[]>(), // Inline modifiers (UI-friendly)
    // Kitchen
    preparationTime: integer('preparation_time').default(15), // minutes
    printerIds: json('printer_ids').$type<string[]>(), // Which printers to send
    // Display
    isPopular: boolean('is_popular').default(false),
    isFeatured: boolean('is_featured').default(false),
    sortOrder: integer('sort_order').default(0),
    layoutType: text('layout_type').default('standard'), // standard, wide, image-only
    // Metadata
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// Modifier Groups (Size, Extras, etc.)
export const modifierGroups = pgTable('modifier_groups', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    nameAr: text('name_ar'),
    minSelection: integer('min_selection').default(0),
    maxSelection: integer('max_selection').default(1),
    isRequired: boolean('is_required').default(false),
    createdAt: timestamp('created_at').defaultNow(),
});

export const modifierOptions = pgTable('modifier_options', {
    id: text('id').primaryKey(),
    groupId: text('group_id').references(() => modifierGroups.id).notNull(),
    name: text('name').notNull(),
    nameAr: text('name_ar'),
    price: real('price').default(0),
    sortOrder: integer('sort_order').default(0),
    isAvailable: boolean('is_available').default(true),
});

// Link items to modifier groups
export const menuItemModifiers = pgTable('menu_item_modifiers', {
    id: serial('id').primaryKey(),
    menuItemId: text('menu_item_id').references(() => menuItems.id).notNull(),
    modifierGroupId: text('modifier_group_id').references(() => modifierGroups.id).notNull(),
    sortOrder: integer('sort_order').default(0),
});

// ============================================================================
// 📋 ORDERS
// ============================================================================

export const orders = pgTable('orders', {
    id: text('id').primaryKey(),
    orderNumber: serial('order_number'), // Sequential daily number
    type: text('type').notNull(), // DINE_IN, TAKEAWAY, DELIVERY
    source: text('source').default('pos'), // pos, call_center, online, app
    // Branch & Location
    branchId: text('branch_id').references(() => branches.id).notNull(),
    tableId: text('table_id'),
    // Customer
    customerId: text('customer_id').references(() => customers.id),
    customerName: text('customer_name'),
    customerPhone: text('customer_phone'),
    deliveryAddress: text('delivery_address'),
    deliveryAddressId: integer('delivery_address_id'),
    // Call Center specific
    isCallCenterOrder: boolean('is_call_center_order').default(false),
    callCenterAgentId: text('call_center_agent_id'),
    // Status
    status: text('status').notNull().default('PENDING'), // PENDING, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
    // Pricing
    subtotal: real('subtotal').notNull(),
    discount: real('discount').default(0),
    discountType: text('discount_type'), // percentage, fixed
    discountReason: text('discount_reason'),
    tax: real('tax').notNull(),
    deliveryFee: real('delivery_fee').default(0),
    serviceCharge: real('service_charge').default(0),
    total: real('total').notNull(),
    // Flags
    freeDelivery: boolean('free_delivery').default(false),
    isUrgent: boolean('is_urgent').default(false),
    isPaid: boolean('is_paid').default(false),
    // Payment
    paymentMethod: text('payment_method'),
    paidAmount: real('paid_amount'),
    changeAmount: real('change_amount'),
    // Notes
    notes: text('notes'),
    kitchenNotes: text('kitchen_notes'),
    deliveryNotes: text('delivery_notes'),
    // Delivery
    driverId: text('driver_id'),
    estimatedDeliveryTime: timestamp('estimated_delivery_time'),
    actualDeliveryTime: timestamp('actual_delivery_time'),
    // Sync
    syncStatus: text('sync_status').default('SYNCED'), // SYNCED, PENDING, FAILED
    // Timestamps
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    completedAt: timestamp('completed_at'),
    cancelledAt: timestamp('cancelled_at'),
    cancelReason: text('cancel_reason'),
    // Shift Tracking (Phase 3: Financial Ironclad)
    shiftId: text('shift_id'),
});

export const orderItems = pgTable('order_items', {
    id: serial('id').primaryKey(),
    orderId: text('order_id').references(() => orders.id).notNull(),
    menuItemId: text('menu_item_id').references(() => menuItems.id),
    name: text('name').notNull(),
    nameAr: text('name_ar'),
    price: real('price').notNull(),
    quantity: integer('quantity').notNull(),
    notes: text('notes'),
    modifiers: json('modifiers').$type<{
        groupName: string;
        optionName: string;
        price: number;
    }[]>(),
    // Kitchen
    status: text('status').default('PENDING'), // PENDING, PREPARING, READY, SERVED
    preparedAt: timestamp('prepared_at'),
    servedAt: timestamp('served_at'),
});

// Order Status History (for tracking)
export const orderStatusHistory = pgTable('order_status_history', {
    id: serial('id').primaryKey(),
    orderId: text('order_id').references(() => orders.id).notNull(),
    status: text('status').notNull(),
    changedBy: text('changed_by'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// 💳 PAYMENTS
// ============================================================================

export const payments = pgTable('payments', {
    id: text('id').primaryKey(),
    orderId: text('order_id').references(() => orders.id).notNull(),
    method: text('method').notNull(), // CASH, VISA, VODAFONE_CASH, INSTAPAY
    amount: real('amount').notNull(),
    referenceNumber: text('reference_number'),
    status: text('status').default('COMPLETED'), // PENDING, COMPLETED, REFUNDED
    processedBy: text('processed_by'),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// 📦 INVENTORY
// ============================================================================

export const warehouses = pgTable('warehouses', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    nameAr: text('name_ar'),
    branchId: text('branch_id').references(() => branches.id),
    type: text('type').default('MAIN'), // MAIN, SUB, KITCHEN, POINT_OF_SALE
    parentId: text('parent_id'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const inventoryItems = pgTable('inventory_items', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    nameAr: text('name_ar'),
    sku: text('sku').unique(),
    barcode: text('barcode'),
    unit: text('unit').notNull(), // kg, g, liter, piece, etc.
    category: text('category'),
    threshold: real('threshold').default(0), // Low stock alert threshold
    costPrice: real('cost_price').default(0),
    purchasePrice: real('purchase_price').default(0),
    supplierId: text('supplier_id'),
    isAudited: boolean('is_audited').default(true),
    auditFrequency: text('audit_frequency').default('DAILY'),
    isComposite: boolean('is_composite').default(false),
    bom: json('bom').$type<any[]>().default([]),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const inventoryStock = pgTable('inventory_stock', {
    id: serial('id').primaryKey(),
    itemId: text('item_id').references(() => inventoryItems.id).notNull(),
    warehouseId: text('warehouse_id').references(() => warehouses.id).notNull(),
    quantity: real('quantity').default(0),
    lastUpdated: timestamp('last_updated').defaultNow(),
});

export const stockMovements = pgTable('stock_movements', {
    id: serial('id').primaryKey(),
    itemId: text('item_id').references(() => inventoryItems.id).notNull(),
    fromWarehouseId: text('from_warehouse_id').references(() => warehouses.id),
    toWarehouseId: text('to_warehouse_id').references(() => warehouses.id),
    quantity: real('quantity').notNull(),
    type: text('type').notNull(), // TRANSFER, ADJUSTMENT, PURCHASE, SALE_CONSUMPTION, WASTE
    referenceId: text('reference_id'), // Order ID, PO ID, etc.
    reason: text('reason'),
    performedBy: text('performed_by'),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// 🍳 RECIPES
// ============================================================================

export const recipes = pgTable('recipes', {
    id: text('id').primaryKey(),
    menuItemId: text('menu_item_id').references(() => menuItems.id).notNull(),
    yield: real('yield').default(1), // How many servings this makes
    instructions: text('instructions'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const recipeIngredients = pgTable('recipe_ingredients', {
    id: serial('id').primaryKey(),
    recipeId: text('recipe_id').references(() => recipes.id).notNull(),
    inventoryItemId: text('inventory_item_id').references(() => inventoryItems.id).notNull(),
    quantity: real('quantity').notNull(),
    unit: text('unit').notNull(),
    notes: text('notes'),
});

// ============================================================================
// 🚚 SUPPLIERS
// ============================================================================

export const suppliers = pgTable('suppliers', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    contactPerson: text('contact_person'),
    phone: text('phone'),
    email: text('email'),
    address: text('address'),
    category: text('category'),
    paymentTerms: text('payment_terms'),
    notes: text('notes'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// 📋 PURCHASE ORDERS
// ============================================================================

export const purchaseOrders = pgTable('purchase_orders', {
    id: text('id').primaryKey(),
    supplierId: text('supplier_id').references(() => suppliers.id).notNull(),
    branchId: text('branch_id').references(() => branches.id).notNull(),
    status: text('status').default('DRAFT'), // DRAFT, SENT, PARTIAL, RECEIVED, CANCELLED
    expectedDate: timestamp('expected_date'),
    subtotal: real('subtotal').default(0),
    notes: text('notes'),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const purchaseOrderItems = pgTable('purchase_order_items', {
    id: serial('id').primaryKey(),
    poId: text('po_id').references(() => purchaseOrders.id).notNull(),
    itemId: text('item_id').references(() => inventoryItems.id).notNull(),
    orderedQty: real('ordered_qty').notNull(),
    receivedQty: real('received_qty').default(0),
    unitPrice: real('unit_price').notNull(),
});

// ============================================================================
// 🖨️ PRINTERS
// ============================================================================

export const printers = pgTable('printers', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    type: text('type').notNull(), // NETWORK, USB, BLUETOOTH
    address: text('address'), // IP address or port
    location: text('location'), // Kitchen, Bar, Reception
    branchId: text('branch_id').references(() => branches.id),
    isActive: boolean('is_active').default(true),
    paperWidth: integer('paper_width').default(80), // mm
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// 🔒 AUDIT LOGS
// ============================================================================

export const auditLogs = pgTable('audit_logs', {
    id: serial('id').primaryKey(),
    eventType: text('event_type').notNull(),
    userId: text('user_id'),
    userName: text('user_name'),
    userRole: text('user_role'),
    branchId: text('branch_id'),
    deviceId: text('device_id'),
    ipAddress: text('ip_address'),
    payload: json('payload'),
    before: json('before'),
    after: json('after'),
    reason: text('reason'),
    signature: text('signature'), // For tamper detection
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// 💰 FISCAL / ETA LOGS
// ============================================================================

export const fiscalLogs = pgTable('fiscal_logs', {
    id: serial('id').primaryKey(),
    orderId: text('order_id'),
    branchId: text('branch_id'),
    status: text('status').notNull(), // PENDING, SUBMITTED, FAILED
    attempt: integer('attempt').default(0),
    lastError: text('last_error'),
    payload: json('payload'),
    response: json('response'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
// ============================================================================
// 🖼️ IMAGES
// ============================================================================

export const images = pgTable('images', {
    id: text('id').primaryKey(),
    key: text('key').notNull(),
    url: text('url').notNull(),
    filename: text('filename'),
    contentType: text('content_type'),
    width: integer('width'),
    height: integer('height'),
    size: integer('size'),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// 🕒 SHIFT MANAGEMENT
// ============================================================================

export const shifts = pgTable('shifts', {
    id: text('id').primaryKey(),
    branchId: text('branch_id').references(() => branches.id).notNull(),
    userId: text('user_id').references(() => users.id).notNull(),
    openingTime: timestamp('opening_time').defaultNow().notNull(),
    closingTime: timestamp('closing_time'),
    openingBalance: real('opening_balance').default(0).notNull(),
    expectedBalance: real('expected_balance').default(0), // System calculated
    actualBalance: real('actual_balance').default(0), // Cashier counted
    status: text('status').default('OPEN').notNull(), // OPEN, CLOSED
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// 🔐 MANAGER APPROVALS
// ============================================================================

export const managerApprovals = pgTable('manager_approvals', {
    id: serial('id').primaryKey(),
    managerId: text('manager_id').references(() => users.id).notNull(),
    branchId: text('branch_id').references(() => branches.id).notNull(),
    actionType: text('action_type').notNull(), // VOID, DISCOUNT, REFUND, ITEM_DELETE
    relatedId: text('related_id'), // Order ID, Item ID, etc.
    reason: text('reason').notNull(),
    details: json('details'),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// 🚚 DELIVERY & LOGISTICS
// ============================================================================

export const deliveryZones = pgTable('delivery_zones', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(), // Maadi, New Cairo, etc.
    nameAr: text('name_ar'),
    branchId: text('branch_id').references(() => branches.id).notNull(),
    deliveryFee: real('delivery_fee').default(0),
    minOrderAmount: real('min_order_amount').default(0),
    estimatedTime: integer('estimated_time').default(45), // minutes
    isActive: boolean('is_active').default(true),
});

export const drivers = pgTable('drivers', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    branchId: text('branch_id').references(() => branches.id),
    status: text('status').default('AVAILABLE'), // AVAILABLE, BUSY, OFFLINE
    currentCashBalance: real('current_cash_balance').default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// ⚙️ SETTINGS
// ============================================================================


export const systemSettings = pgTable('system_settings', {
    id: serial('id').primaryKey(),
    key: text('key').unique().notNull(),
    value: json('value'),
    category: text('category'),
    updatedBy: text('updated_by'),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const settings = pgTable('settings', {
    key: text('key').primaryKey(),
    value: json('value').notNull(),
    category: text('category').default('general'),
    updatedBy: text('updated_by'),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// 📊 TYPE EXPORTS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Branch = typeof branches.$inferSelect;
export type NewBranch = typeof branches.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;

export type MenuCategory = typeof menuCategories.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;

export type ManagerApproval = typeof managerApprovals.$inferSelect;

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;

export type AuditLog = typeof auditLogs.$inferSelect;
export type Image = typeof images.$inferSelect;
export type FiscalLog = typeof fiscalLogs.$inferSelect;

// ============================================================================
// 🪑 TABLES & FLOOR PLAN
// ============================================================================

export const floorZones = pgTable('floor_zones', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    branchId: text('branch_id').references(() => branches.id).notNull(),
    width: integer('width').default(800),
    height: integer('height').default(600),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const tables = pgTable('tables', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    zoneId: text('zone_id').references(() => floorZones.id),
    branchId: text('branch_id').references(() => branches.id).notNull(),

    // Position & Layout
    x: integer('x').default(0),
    y: integer('y').default(0),
    width: integer('width').default(100),
    height: integer('height').default(100),
    shape: text('shape').default('rectangle'), // rectangle, circle, etc.
    seats: integer('seats').default(4),

    // State Machine
    status: text('status').default('AVAILABLE').notNull(),
    // AVAILABLE: Ready for refined guests
    // OCCUPIED: Guests are seated (even if no order yet)
    // RESERVED: Guests are expected
    // DIRTY: Guests left, needs cleaning
    // OUT_OF_SERVICE: Broken table / maintenance

    // Metadata for active session
    currentOrderId: text('current_order_id'), // Link to the active order if occupied
    lockedByUserId: text('locked_by_user_id'), // For soft locking (collision detection)

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export type Table = typeof tables.$inferSelect;
export type NewTable = typeof tables.$inferInsert;
export type FloorZone = typeof floorZones.$inferSelect;
