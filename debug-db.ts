
import { db } from './server/db';
import { menuCategories, menuItems } from './src/db/schema';

async function checkDb() {
    try {
        const categories = await db.select().from(menuCategories);
        const items = await db.select().from(menuItems);

        console.log('--- Categories ---');
        console.table(categories);

        console.log('--- Items ---');
        console.table(items);

        process.exit(0);
    } catch (error) {
        console.error('Error checking DB:', error);
        process.exit(1);
    }
}

checkDb();
