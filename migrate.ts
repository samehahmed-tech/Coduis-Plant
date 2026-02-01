
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

        console.log('✅ Deep migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
