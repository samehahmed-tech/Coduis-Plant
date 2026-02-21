import * as dotenv from 'dotenv';
import { db } from '../server/db';
import { branches, menuCategories, printers } from '../src/db/schema';
import { eq } from 'drizzle-orm';

dotenv.config();

type PrinterSeed = {
    id: string;
    name: string;
    location: string;
    address: string;
};

const DEFAULT_PRINTERS: PrinterSeed[] = [
    { id: 'PRN-KITCHEN', name: 'Kitchen Main', location: 'Kitchen', address: 'kitchen-main.local' },
    { id: 'PRN-GRILL', name: 'Kitchen Grill', location: 'Grill', address: 'kitchen-grill.local' },
    { id: 'PRN-FRYER', name: 'Kitchen Fryer', location: 'Fryer', address: 'kitchen-fryer.local' },
    { id: 'PRN-SALAD', name: 'Kitchen Salad', location: 'Salad', address: 'kitchen-salad.local' },
    { id: 'PRN-BAKERY', name: 'Kitchen Bakery', location: 'Bakery', address: 'kitchen-bakery.local' },
    { id: 'PRN-DESSERT', name: 'Kitchen Dessert', location: 'Dessert', address: 'kitchen-dessert.local' },
    { id: 'PRN-BAR', name: 'Bar Printer', location: 'Bar', address: 'bar-printer.local' },
];

const STATION_RULES: Array<{ printerId: string; tokens: string[] }> = [
    { printerId: 'PRN-BAR', tokens: ['bar', 'drink', 'juice', 'coffee', 'mojito', 'cocktail', 'مشروب', 'قهوة', 'بار'] },
    { printerId: 'PRN-DESSERT', tokens: ['dessert', 'sweet', 'cake', 'ice cream', 'حلو', 'حلويات'] },
    { printerId: 'PRN-BAKERY', tokens: ['bakery', 'bread', 'croissant', 'مخبوز', 'خبز'] },
    { printerId: 'PRN-GRILL', tokens: ['grill', 'bbq', 'kebab', 'steak', 'مشوي', 'جريل'] },
    { printerId: 'PRN-FRYER', tokens: ['fryer', 'fried', 'fries', 'بطاطس', 'مقلي'] },
    { printerId: 'PRN-SALAD', tokens: ['salad', 'soup', 'سلطة', 'شوربة'] },
];

const normalize = (value: unknown) => String(value || '').toLowerCase().trim();
const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const pickCategoryPrinters = (category: { name?: string | null; nameAr?: string | null }) => {
    const name = normalize(category.name);
    const nameAr = normalize(category.nameAr);
    const blob = `${name} ${nameAr}`;

    const hits = STATION_RULES
        .filter((rule) => rule.tokens.some((token) => blob.includes(token)))
        .map((rule) => rule.printerId);

    return unique(hits.length > 0 ? hits : ['PRN-KITCHEN']);
};

const resolveBranchId = async () => {
    const explicit = String(process.env.PRINTER_BRANCH_ID || '').trim();
    if (explicit) return explicit;
    const [branch] = await db.select().from(branches).limit(1);
    return branch?.id ? String(branch.id) : '';
};

const main = async () => {
    const branchId = await resolveBranchId();
    if (!branchId) {
        console.error(JSON.stringify({ ok: false, error: 'NO_BRANCH_FOUND' }, null, 2));
        process.exit(1);
    }

    for (const seed of DEFAULT_PRINTERS) {
        await db
            .insert(printers)
            .values({
                id: seed.id,
                name: seed.name,
                type: 'NETWORK',
                address: seed.address,
                location: seed.location,
                branchId,
                isActive: true,
                paperWidth: 80,
                createdAt: new Date(),
            })
            .onConflictDoUpdate({
                target: printers.id,
                set: {
                    name: seed.name,
                    type: 'NETWORK',
                    address: seed.address,
                    location: seed.location,
                    branchId,
                    isActive: true,
                    paperWidth: 80,
                },
            });
    }

    const categories = await db.select().from(menuCategories);
    let updatedCategories = 0;
    for (const category of categories) {
        const routing = pickCategoryPrinters(category);
        await db
            .update(menuCategories)
            .set({ printerIds: routing, updatedAt: new Date() })
            .where(eq(menuCategories.id, category.id));
        updatedCategories += 1;
    }

    console.log(JSON.stringify({
        ok: true,
        branchId,
        printersUpserted: DEFAULT_PRINTERS.length,
        categoriesUpdated: updatedCategories,
        note: 'Review printer addresses in Settings > Printers and update to real LAN IP/hostnames.',
    }, null, 2));
};

main().catch((error: any) => {
    console.error(JSON.stringify({
        ok: false,
        error: error?.message || 'SETUP_FAILED',
    }, null, 2));
    process.exit(1);
});
