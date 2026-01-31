-- RESTOFLOW ERP: LOCAL SQLITE SCHEMA (PER DEVICE)
-- Optimized for POS stability, power-loss resilience, and event-sourcing.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;

-- 1. Metadata: Per-device identity
CREATE TABLE IF NOT EXISTS meta_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 2. Event Log: The heart of the sync mechanism
-- This table stores every atomic action before it goes to the server.
CREATE TABLE IF NOT EXISTS event_log (
    event_id TEXT PRIMARY KEY,       -- UUID v4
    branch_id TEXT NOT NULL,         -- e.g., 'BR-CAI-01'
    device_id TEXT NOT NULL,         -- Persistent device UUID
    event_type TEXT NOT NULL,        -- 'ORDER_CREATED', 'STOCK_ADJUSTED', etc.
    entity_id TEXT NOT NULL,         -- ID of the related order/item
    payload JSON NOT NULL,           -- Full action data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status INTEGER DEFAULT 0,   -- 0: Pending, 1: Synced, -1: Failed
    retry_count INTEGER DEFAULT 0,
    error_message TEXT
);

-- 3. Inventory: Local cache for offline validation
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    current_stock REAL DEFAULT 0,
    min_threshold REAL DEFAULT 0,
    unit TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Orders: Local transaction store
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,             -- Locally generated UUID
    branch_id TEXT NOT NULL,
    customer_name TEXT,
    total_amount REAL NOT NULL,
    tax_amount REAL NOT NULL,
    payment_method TEXT,             -- 'CASH', 'CARD', etc.
    status TEXT DEFAULT 'PENDING',    -- 'PENDING', 'PAID', 'CANCELLED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    quantity REAL NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_sync_pending ON event_log(sync_status) WHERE sync_status = 0;
CREATE INDEX IF NOT EXISTS idx_order_created ON orders(created_at);
