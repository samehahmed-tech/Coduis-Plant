import * as dotenv from 'dotenv';
import { db } from '../server/db';
import { menuCategories, menuItems, printers } from '../src/db/schema';

dotenv.config();

const asArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.map((item) => String(item)).filter(Boolean);
};

const sample = (rows: Array<{ id: string; name?: string }>, size = 12) =>
    rows.slice(0, size).map((row) => ({ id: row.id, name: row.name || '' }));

const main = async () => {
    const [categories, items, allPrinters] = await Promise.all([
        db.select().from(menuCategories),
        db.select().from(menuItems),
        db.select().from(printers),
    ]);

    const activePrinterIds = new Set(
        allPrinters
            .filter((printer) => printer.isActive !== false)
            .map((printer) => String(printer.id)),
    );

    const categoryById = new Map(
        categories.map((category) => [String(category.id), category]),
    );

    const categoriesWithoutRouting = categories
        .filter((category) => asArray(category.printerIds).length === 0)
        .map((category) => ({ id: String(category.id), name: String(category.name || '') }));

    const itemsWithoutDirectRouting = items
        .filter((item) => asArray(item.printerIds).length === 0)
        .map((item) => ({ id: String(item.id), name: String(item.name || ''), categoryId: String(item.categoryId || '') }));

    const itemsWithoutAnyRouting = items
        .filter((item) => {
            const itemPrinters = asArray(item.printerIds);
            if (itemPrinters.length > 0) return false;
            const category = categoryById.get(String(item.categoryId || ''));
            const categoryPrinters = asArray(category?.printerIds);
            return categoryPrinters.length === 0;
        })
        .map((item) => ({ id: String(item.id), name: String(item.name || ''), categoryId: String(item.categoryId || '') }));

    const invalidCategoryLinks = categories.flatMap((category) =>
        asArray(category.printerIds)
            .filter((printerId) => !activePrinterIds.has(printerId))
            .map((printerId) => ({ categoryId: String(category.id), categoryName: String(category.name || ''), printerId })),
    );

    const invalidItemLinks = items.flatMap((item) =>
        asArray(item.printerIds)
            .filter((printerId) => !activePrinterIds.has(printerId))
            .map((printerId) => ({ itemId: String(item.id), itemName: String(item.name || ''), printerId })),
    );

    const summary = {
        totals: {
            activePrinters: activePrinterIds.size,
            categories: categories.length,
            items: items.length,
        },
        coverage: {
            categoriesWithRouting: categories.length - categoriesWithoutRouting.length,
            categoriesWithoutRouting: categoriesWithoutRouting.length,
            itemsWithDirectRouting: items.length - itemsWithoutDirectRouting.length,
            itemsWithoutDirectRouting: itemsWithoutDirectRouting.length,
            itemsWithAnyRouting: items.length - itemsWithoutAnyRouting.length,
            itemsWithoutAnyRouting: itemsWithoutAnyRouting.length,
        },
        integrity: {
            invalidCategoryPrinterLinks: invalidCategoryLinks.length,
            invalidItemPrinterLinks: invalidItemLinks.length,
        },
        samples: {
            categoriesWithoutRouting: sample(categoriesWithoutRouting),
            itemsWithoutAnyRouting: sample(itemsWithoutAnyRouting),
            invalidCategoryLinks: invalidCategoryLinks.slice(0, 12),
            invalidItemLinks: invalidItemLinks.slice(0, 12),
        },
    };

    console.log(JSON.stringify(summary, null, 2));

    const blockingIssues =
        activePrinterIds.size === 0 ||
        itemsWithoutAnyRouting.length > 0 ||
        invalidCategoryLinks.length > 0 ||
        invalidItemLinks.length > 0;

    if (blockingIssues) {
        process.exit(1);
    }
};

main().catch((error: any) => {
    console.error(JSON.stringify({
        ok: false,
        error: error?.message || 'audit_failed',
    }, null, 2));
    process.exit(1);
});
