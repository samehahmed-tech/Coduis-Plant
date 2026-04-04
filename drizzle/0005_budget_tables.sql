-- 0005: Budget Management Tables
-- Enables Budget vs Actual comparison for financial planning

CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    branch_id TEXT REFERENCES branches(id),
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, CLOSED
    notes TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_lines (
    id SERIAL PRIMARY KEY,
    budget_id TEXT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL REFERENCES chart_of_accounts(id),
    planned_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    description TEXT
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_budgets_branch ON budgets(branch_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_budget_lines_budget ON budget_lines(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_account ON budget_lines(account_id);
