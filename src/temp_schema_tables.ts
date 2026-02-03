
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
