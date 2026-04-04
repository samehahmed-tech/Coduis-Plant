-- Phase 1: Barcode System - Add barcode and sku columns to menu_items
-- These columns may already exist on inventory_items but need to be added to menu_items

-- Add barcode column to menu_items (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'menu_items' AND column_name = 'barcode'
    ) THEN
        ALTER TABLE menu_items ADD COLUMN barcode TEXT;
    END IF;
END $$;

-- Add sku column to menu_items (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'menu_items' AND column_name = 'sku'
    ) THEN
        ALTER TABLE menu_items ADD COLUMN sku TEXT;
    END IF;
END $$;

-- Create indexes for barcode lookups (used by POS scanner)
CREATE INDEX IF NOT EXISTS idx_menu_items_barcode ON menu_items (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_menu_items_sku ON menu_items (sku) WHERE sku IS NOT NULL;

-- Ensure inventory_items also has proper indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_barcode ON inventory_items (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items (sku) WHERE sku IS NOT NULL;
