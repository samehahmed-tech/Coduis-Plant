-- ============================================================================
-- 🔒 DATA INTEGRITY CONSTRAINTS
-- Migration: Add CHECK constraints, CASCADE deletes, and soft-delete support
-- ============================================================================

-- ── CHECK constraints on monetary columns (prevent negative/invalid values) ──
ALTER TABLE "orders" ADD CONSTRAINT "orders_subtotal_check" CHECK ("subtotal" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_check" CHECK ("total" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_tax_check" CHECK ("tax" >= 0);

ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_check" CHECK ("amount" >= 0);

ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_price_check" CHECK ("price" >= 0);

ALTER TABLE "inventory_stock" ADD CONSTRAINT "inv_stock_qty_check" CHECK ("quantity" >= 0);

-- ── CASCADE deletes for dependent records ──
-- When an order is deleted, its items and status history should go too.
-- Use DO block to make idempotent (safe to re-run).

DO $$ BEGIN
    -- order_items → orders
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'order_items_order_id_orders_id_fk'
    ) THEN
        ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_orders_id_fk";
    END IF;
    ALTER TABLE "order_items"
        ADD CONSTRAINT "order_items_order_id_orders_id_fk"
        FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping order_items CASCADE: %', SQLERRM;
END $$;

DO $$ BEGIN
    -- order_status_history → orders
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'order_status_history_order_id_orders_id_fk'
    ) THEN
        ALTER TABLE "order_status_history" DROP CONSTRAINT "order_status_history_order_id_orders_id_fk";
    END IF;
    ALTER TABLE "order_status_history"
        ADD CONSTRAINT "order_status_history_order_id_orders_id_fk"
        FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping order_status_history CASCADE: %', SQLERRM;
END $$;

DO $$ BEGIN
    -- payments → orders
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'payments_order_id_orders_id_fk'
    ) THEN
        ALTER TABLE "payments" DROP CONSTRAINT "payments_order_id_orders_id_fk";
    END IF;
    ALTER TABLE "payments"
        ADD CONSTRAINT "payments_order_id_orders_id_fk"
        FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping payments CASCADE: %', SQLERRM;
END $$;

-- ── Soft-delete: Add deleted_at column to critical tables ──
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP;
ALTER TABLE "menu_categories" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP;
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP;

-- ── updated_at auto-trigger ──
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables that have updated_at
DO $$ BEGIN
    CREATE TRIGGER set_updated_at_orders
        BEFORE UPDATE ON "orders"
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER set_updated_at_menu_items
        BEFORE UPDATE ON "menu_items"
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER set_updated_at_customers
        BEFORE UPDATE ON "customers"
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TRIGGER set_updated_at_inventory_stock
        BEFORE UPDATE ON "inventory_stock"
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
