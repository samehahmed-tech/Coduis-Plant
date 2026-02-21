-- =============================================================================
-- RestoFlow ERP — Performance Indexes
-- Run after initial schema migration
-- =============================================================================

-- Orders: most queried table
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_branch_status ON orders(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_branch_created ON orders(branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_shift_id ON orders(shift_id);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);

-- Order Status History
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_at ON order_status_history(changed_at DESC);

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_branch_id ON payments(branch_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);

-- Menu Items
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON menu_items(is_available);

-- Inventory Stock
CREATE INDEX IF NOT EXISTS idx_inventory_stock_item_id ON inventory_stock(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_warehouse_id ON inventory_stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_item_warehouse ON inventory_stock(item_id, warehouse_id);

-- Stock Movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_item_id ON stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_tier ON customers(loyalty_tier);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON customers(total_spent DESC);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_branch_id ON audit_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_branch ON audit_logs(event_type, branch_id);

-- Fiscal Logs
CREATE INDEX IF NOT EXISTS idx_fiscal_logs_order_id ON fiscal_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_logs_status ON fiscal_logs(status);
CREATE INDEX IF NOT EXISTS idx_fiscal_logs_branch_id ON fiscal_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_logs_created_at ON fiscal_logs(created_at DESC);

-- ETA Dead Letters
CREATE INDEX IF NOT EXISTS idx_eta_dead_letters_status ON eta_dead_letters(status);
CREATE INDEX IF NOT EXISTS idx_eta_dead_letters_order_id ON eta_dead_letters(order_id);

-- Shifts
CREATE INDEX IF NOT EXISTS idx_shifts_branch_id ON shifts(branch_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_opened_at ON shifts(opened_at DESC);

-- Tables
CREATE INDEX IF NOT EXISTS idx_tables_branch_id ON tables(branch_id);
CREATE INDEX IF NOT EXISTS idx_tables_zone_id ON tables(zone_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);

-- User Sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_id ON user_sessions(token_id);

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);

-- Idempotency Keys (TTL-based cleanup)
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key_scope ON idempotency_keys(key, scope);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created ON idempotency_keys(created_at);

-- Purchase Orders
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_branch_id ON purchase_orders(branch_id);

-- Settings (fast key lookup)
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Recipes
CREATE INDEX IF NOT EXISTS idx_recipes_menu_item_id ON recipes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
