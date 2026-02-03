
import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function checkDbRaw() {
    try {
        const categories = await db.execute(sql`SELECT * FROM menu_categories`);
        const items = await db.execute(sql`SELECT * FROM menu_items`);

        console.log('--- Categories Raw ---');
        console.table(categories.rows);

        console.log('--- Items Raw ---');
        console.table(items.rows);

        process.exit(0);
    } catch (error) {
        console.error('Error checking DB Raw:', error);
        process.exit(1);
    }
}

checkDbRaw();
