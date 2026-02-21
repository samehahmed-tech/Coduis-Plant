
import { db } from './server/db';
import { printers, menuCategories } from './src/db/schema';

async function diagnosePrinters() {
    const allPrinters = await db.select().from(printers);
    console.log('--- Printers ---');
    console.table(allPrinters.map(p => ({
        id: p.id,
        name: p.name,
        isActive: p.isActive,
        type: p.type,
        address: p.address
    })));

    const categories = await db.select().from(menuCategories);
    console.log('\n--- Categories Routing ---');
    console.table(categories.map(c => ({
        id: c.id,
        name: c.name,
        printerIds: JSON.stringify(c.printerIds)
    })));
}

diagnosePrinters().catch(console.error);
