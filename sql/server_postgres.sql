-- RESTOFLOW ERP: CENTRAL POSTGRESQL SCHEMA (SOURCE OF TRUTH)
-- Designed for multi-tenant, multi-branch scaling and data integrity.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations & Branches
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subscription_plan TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branches (
    id TEXT PRIMARY KEY, -- Logical ID like BR-CAI-01
    org_id UUID REFERENCES organizations(id),
    name TEXT NOT NULL,
    location TEXT,
    timezone TEXT DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Devices (Registry for security and sync tracking)
CREATE TABLE devices (
    id UUID PRIMARY KEY,
    branch_id TEXT REFERENCES branches(id),
    device_name TEXT,
    last_seen_at TIMESTAMPTZ,
    app_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. The Global Event Ledger
-- Every sync'd event is persisted here for total non-repudiation (Audit Trail)
CREATE TABLE event_ledger (
    event_id UUID PRIMARY KEY,
    branch_id TEXT NOT NULL REFERENCES branches(id),
    device_id UUID NOT NULL REFERENCES devices(id),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    device_timestamp TIMESTAMPTZ NOT NULL,
    server_timestamp TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ -- When the ERP normalized records were updated
);

-- 4. ERP Master Tables (Normalized)
CREATE TABLE global_orders (
    id UUID PRIMARY KEY,
    branch_id TEXT NOT NULL REFERENCES branches(id),
    device_id UUID NOT NULL REFERENCES devices(id),
    order_number TEXT NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    tax DECIMAL(12,2) NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE global_inventory (
    branch_id TEXT NOT NULL REFERENCES branches(id),
    item_key TEXT NOT NULL,
    stock_level DECIMAL(12,3) NOT NULL,
    last_sync_event UUID REFERENCES event_ledger(event_id),
    PRIMARY KEY (branch_id, item_key)
);

-- Indices for reporting
CREATE INDEX idx_ledger_branch_time ON event_ledger(branch_id, device_timestamp DESC);
CREATE INDEX idx_orders_branch_status ON global_orders(branch_id, status);
