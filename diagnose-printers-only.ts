
import { db } from './server/db';
import { printers } from './src/db/schema';

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
}

diagnosePrinters().catch(console.error);
