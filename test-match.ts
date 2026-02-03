
import { db } from './server/db';
import { menuCategories, menuItems } from './src/db/schema';

async function testMatch() {
    try {
        const categories = await db.select().from(menuCategories);
        const items = await db.select().from(menuItems);

        console.log('Category IDs:', categories.map(c => c.id));
        console.log('Item CategoryIDs:', items.map(i => i.categoryId));

        const fullMenu = categories.map(cat => ({
            name: cat.name,
            itemCount: items.filter(item => item.categoryId === cat.id).length
        }));

        console.table(fullMenu);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

testMatch();
