-- ============================================================================
-- 📇 PERFORMANCE INDEXES — Phase 2
-- Migration: Additional indexes for finance, sessions, and auth optimization
-- ============================================================================

-- Journal Entries: finance reports filter by date + status constantly
CREATE INDEX CONCURRENTLY IF NOT EXISTS "journal_entries_date_status_idx" ON "journal_entries" ("date", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "journal_entries_source_idx" ON "journal_entries" ("source");

-- Journal Lines: join lookups from report queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "journal_lines_entry_idx" ON "journal_lines" ("journal_entry_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "journal_lines_account_idx" ON "journal_lines" ("account_id");

-- Chart of Accounts: type filtering in reports
CREATE INDEX CONCURRENTLY IF NOT EXISTS "coa_type_idx" ON "chart_of_accounts" ("type");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "coa_code_idx" ON "chart_of_accounts" ("code");

-- User Sessions: session management, active lookups, admin queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "user_sessions_user_active_idx" ON "user_sessions" ("user_id", "is_active");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "user_sessions_last_seen_idx" ON "user_sessions" ("last_seen_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "user_sessions_expires_idx" ON "user_sessions" ("expires_at");

-- Users: login lookups by email and PIN
CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_email_idx" ON "users" ("email");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_role_idx" ON "users" ("role");

-- Budget Lines: budget report queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "budget_lines_budget_idx" ON "budget_lines" ("budget_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "budget_lines_account_idx" ON "budget_lines" ("account_id");

-- Employees: branch-based attendance queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "employees_branch_idx" ON "employees" ("branch_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "attendance_employee_date_idx" ON "attendance" ("employee_id", "date");

-- Shifts: active shift lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS "shifts_branch_status_idx" ON "shifts" ("branch_id", "status");

-- Purchase Orders: supplier and status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "po_supplier_idx" ON "purchase_orders" ("supplier_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "po_status_date_idx" ON "purchase_orders" ("status", "created_at");

-- Inventory Batches: FEFO ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS "inv_batches_item_expiry_idx" ON "inventory_batches" ("item_id", "expiry_date");
