
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    try {
        console.log('🚀 Starting deep migration...');

        // Ensure all columns exist in menu_categories
        await pool.query(`
            ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS image TEXT;
            ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS name_ar TEXT;
            ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS description TEXT;
            ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS icon TEXT;
            ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS color TEXT;
            ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
            ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
            ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS target_order_types JSONB DEFAULT '[]';
            ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS menu_ids JSONB DEFAULT '[]';
        `);

        // Ensure all columns exist in menu_items
        await pool.query(`
            ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS name_ar TEXT;
            ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS description TEXT;
            ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS description_ar TEXT;
            ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;
            ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT 0;
            ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image TEXT;
            ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
            ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS preparation_time INTEGER DEFAULT 15;
            ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;
            ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
            ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
        `);

        // Inventory master tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory_items(
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            name_ar TEXT,
            sku TEXT UNIQUE,
            barcode TEXT,
            unit TEXT NOT NULL,
            category TEXT,
            threshold DECIMAL(12, 3) DEFAULT 0,
            cost_price DECIMAL(12, 2) DEFAULT 0,
            purchase_price DECIMAL(12, 2) DEFAULT 0,
            supplier_id TEXT,
            is_audited BOOLEAN DEFAULT true,
            audit_frequency TEXT DEFAULT 'DAILY', --DAILY, WEEKLY, MONTHLY
                is_composite BOOLEAN DEFAULT false,
            bom JSONB DEFAULT '[]', --Bill of Materials
                is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

            CREATE TABLE IF NOT EXISTS warehouses(
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            name_ar TEXT,
            branch_id TEXT,
            type TEXT NOT NULL, --MAIN, SUB, KITCHEN, POS
                parent_id TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

            CREATE TABLE IF NOT EXISTS inventory_stock(
            item_id TEXT REFERENCES inventory_items(id) ON DELETE CASCADE,
            warehouse_id TEXT REFERENCES warehouses(id) ON DELETE CASCADE,
            quantity DECIMAL(12, 3) DEFAULT 0,
            last_audit_date TIMESTAMPTZ,
            PRIMARY KEY(item_id, warehouse_id)
        );

            CREATE TABLE IF NOT EXISTS stock_movements(
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            item_id TEXT REFERENCES inventory_items(id) ON DELETE CASCADE,
            from_warehouse_id TEXT REFERENCES warehouses(id) ON DELETE SET NULL,
            to_warehouse_id TEXT REFERENCES warehouses(id) ON DELETE SET NULL,
            quantity DECIMAL(12, 3) NOT NULL,
            type TEXT NOT NULL, --TRANSFER, ADJUSTMENT, PURCHASE, SALE, WASTE
                reason TEXT,
            actor_id TEXT,
            reference_id TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        `);

        // Update columns if they don't exist
        await pool.query(`
            ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(12, 2) DEFAULT 0;
            ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS is_audited BOOLEAN DEFAULT true;
            ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS audit_frequency TEXT DEFAULT 'DAILY';
            ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS is_composite BOOLEAN DEFAULT false;
            ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS bom JSONB DEFAULT '[]';
            
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS name_ar TEXT;
            ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS parent_id TEXT;
        `);

        console.log('✅ Deep migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
