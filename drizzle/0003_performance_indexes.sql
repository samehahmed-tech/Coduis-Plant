-- ============================================================================
-- 📇 PERFORMANCE INDEXES
-- Migration: Add performance indexes on frequently queried columns
-- ============================================================================

-- Orders: most queried table in the system
CREATE INDEX CONCURRENTLY IF NOT EXISTS "orders_branch_date_idx" ON "orders" ("branch_id", "created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "orders_status_idx" ON "orders" ("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "orders_customer_idx" ON "orders" ("customer_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "orders_shift_idx" ON "orders" ("shift_id");

-- Order Items: JOINs for reports and KDS
CREATE INDEX CONCURRENTLY IF NOT EXISTS "order_items_order_idx" ON "order_items" ("order_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "order_items_menu_item_idx" ON "order_items" ("menu_item_id");

-- Inventory: stock lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS "inv_stock_item_wh_idx" ON "inventory_stock" ("item_id", "warehouse_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "stock_mov_item_date_idx" ON "stock_movements" ("item_id", "created_at");

-- Audit Logs: forensics and compliance queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_event_date_idx" ON "audit_logs" ("event_type", "created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "audit_user_idx" ON "audit_logs" ("user_id");

-- Payments: order payment lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS "payments_order_idx" ON "payments" ("order_id");

-- Menu Items: category browsing
CREATE INDEX CONCURRENTLY IF NOT EXISTS "menu_items_category_idx" ON "menu_items" ("category_id", "is_available");

-- Customers: search by name
CREATE INDEX CONCURRENTLY IF NOT EXISTS "customers_name_idx" ON "customers" ("name");

-- Reservations: date lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS "reservations_date_idx" ON "reservations" ("branch_id", "date");

-- Delivery Assignments: tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS "delivery_assignments_order_idx" ON "delivery_assignments" ("order_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "delivery_assignments_driver_idx" ON "delivery_assignments" ("driver_id", "status");

-- Day Close: branch + date lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS "day_close_branch_date_idx" ON "day_close_reports" ("branch_id", "date");
