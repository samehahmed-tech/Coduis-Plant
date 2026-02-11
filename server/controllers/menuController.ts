import { Request, Response } from 'express';
import { db } from '../db';
import { menuCategories, menuItems } from '../../src/db/schema';
import { and, eq } from 'drizzle-orm';
import { getStringParam } from '../utils/request';
import { pool } from '../db';

const tableColumnsCache = new Map<string, Set<string>>();

const getTableColumns = async (tableName: string): Promise<Set<string>> => {
    const cacheKey = tableName.toLowerCase();
    const cached = tableColumnsCache.get(cacheKey);
    if (cached) return cached;

    const result = await pool.query<{ column_name: string }>(
        `select column_name
         from information_schema.columns
         where table_schema = 'public'
           and table_name = $1`,
        [cacheKey],
    );

    const columns = new Set(result.rows.map((r) => r.column_name));
    tableColumnsCache.set(cacheKey, columns);
    return columns;
};

const hasAnyColumn = (columns: Set<string>) => columns.size > 0;

const readCategoriesCompat = async () => {
    const columns = await getTableColumns('menu_categories');
    if (!hasAnyColumn(columns)) {
        return [];
    }

    const selectParts = [
        `id`,
        `name`,
        `name_ar as "nameAr"`,
        `description`,
        `icon`,
        `image`,
        `color`,
        `sort_order as "sortOrder"`,
        `is_active as "isActive"`,
        columns.has('target_order_types')
            ? `target_order_types as "targetOrderTypes"`
            : `'[]'::json as "targetOrderTypes"`,
        columns.has('menu_ids')
            ? `menu_ids as "menuIds"`
            : `'[]'::json as "menuIds"`,
        columns.has('printer_ids')
            ? `printer_ids as "printerIds"`
            : `'[]'::json as "printerIds"`,
        `created_at as "createdAt"`,
        `updated_at as "updatedAt"`,
    ];

    const query = `
        select ${selectParts.join(', ')}
        from menu_categories
        order by sort_order, name
    `;

    const result = await pool.query(query);
    return result.rows;
};

const sanitizeCategoryPayload = async (payload: Record<string, any>) => {
    const columns = await getTableColumns('menu_categories');
    const sanitized = { ...payload };

    if (!columns.has('target_order_types')) delete sanitized.targetOrderTypes;
    if (!columns.has('menu_ids')) delete sanitized.menuIds;
    if (!columns.has('printer_ids')) delete sanitized.printerIds;

    return sanitized;
};

// --- Categories ---
export const getAllCategories = async (req: Request, res: Response) => {
    try {
        // Read categories with backward-compat fallback for databases missing newer columns.
        const categories = await readCategoriesCompat();
        res.json(categories);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createCategory = async (req: Request, res: Response) => {
    try {
        const safePayload = await sanitizeCategoryPayload(req.body || {});
        const category = await db.insert(menuCategories).values({
            ...(safePayload as any),
            isActive: req.body.isActive !== false, // Default to true if not specified
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any).returning();
        res.status(201).json(category[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'CATEGORY_ID_REQUIRED' });
        const { id: _, ...rawUpdateData } = req.body; // Prevent updating ID
        const updateData = await sanitizeCategoryPayload(rawUpdateData);
        const updated = await db.update(menuCategories)
            .set({ ...(updateData as any), updatedAt: new Date() } as any)
            .where(eq(menuCategories.id, id))
            .returning();

        if (updated.length === 0) return res.status(404).json({ error: 'Category not found' });
        res.json(updated[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'CATEGORY_ID_REQUIRED' });
        // Also delete items in this category or set category_id to null? 
        // For safety, let's just delete the category. Cascade depends on DB setup.
        await db.delete(menuCategories).where(eq(menuCategories.id, id));
        res.json({ message: 'Category deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// --- Items ---
export const getMenuItems = async (req: Request, res: Response) => {
    try {
        const category_id = getStringParam(req.query.category_id);
        const available_only = getStringParam(req.query.available_only);

        const conditions: any[] = [];
        if (available_only === 'true') conditions.push(eq(menuItems.isAvailable, true));
        if (category_id) conditions.push(eq(menuItems.categoryId, category_id));

        const query = conditions.length
            ? db.select().from(menuItems).where(and(...conditions))
            : db.select().from(menuItems);

        const items = await query.orderBy(menuItems.sortOrder, menuItems.name);
        res.json(items);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createItem = async (req: Request, res: Response) => {
    try {
        const item = await db.insert(menuItems).values({
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();
        res.status(201).json(item[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateItem = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'ITEM_ID_REQUIRED' });
        const { id: _, category_id, ...updateData } = req.body; // Prevent updating ID
        const updated = await db.update(menuItems)
            .set({
                ...updateData,
                categoryId: category_id || updateData.categoryId,
                updatedAt: new Date()
            })
            .where(eq(menuItems.id, id))
            .returning();

        if (updated.length === 0) return res.status(404).json({ error: 'Item not found' });
        res.json(updated[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteItem = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'ITEM_ID_REQUIRED' });
        await db.delete(menuItems).where(eq(menuItems.id, id));
        res.json({ message: 'Item deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getFullMenu = async (req: Request, res: Response) => {
    try {
        const available_only = getStringParam(req.query.available_only);

        // Get all categories
        const categories = await readCategoriesCompat();

        // Get items - filter by availability and published status for POS
        let items;
        if (available_only === 'true') {
            items = await db.select().from(menuItems)
                .where(and(
                    eq(menuItems.isAvailable, true),
                    eq(menuItems.status, 'published')
                ))
                .orderBy(menuItems.sortOrder);
        } else {
            items = await db.select().from(menuItems)
                .orderBy(menuItems.sortOrder);
        }

        const fullMenu = categories.map(cat => ({
            ...cat,
            items: items.filter(item => item.categoryId === cat.id)
        }));

        res.json(fullMenu);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// --- Lifecycle Workflow ---

/**
 * Approve a menu item (moves from draft/pending_approval -> approved)
 * POST /api/menu/items/:id/approve
 */
export const approveItem = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'ITEM_ID_REQUIRED' });

        const userId = (req as any).user?.id;

        const updated = await db.update(menuItems)
            .set({
                status: 'approved',
                approvedBy: userId,
                approvedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(menuItems.id, id))
            .returning();

        if (updated.length === 0) return res.status(404).json({ error: 'Item not found' });
        res.json(updated[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Publish a menu item (makes it live on POS)
 * POST /api/menu/items/:id/publish
 */
export const publishItem = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'ITEM_ID_REQUIRED' });

        const updated = await db.update(menuItems)
            .set({
                status: 'published',
                publishedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(menuItems.id, id))
            .returning();

        if (updated.length === 0) return res.status(404).json({ error: 'Item not found' });
        res.json(updated[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Request a price change (requires approval before taking effect)
 * POST /api/menu/items/:id/request-price-change
 */
export const requestPriceChange = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'ITEM_ID_REQUIRED' });

        const { newPrice, reason } = req.body;
        if (!newPrice) return res.status(400).json({ error: 'NEW_PRICE_REQUIRED' });

        const [existing] = await db.select().from(menuItems).where(eq(menuItems.id, id));
        if (!existing) return res.status(404).json({ error: 'Item not found' });

        const updated = await db.update(menuItems)
            .set({
                previousPrice: existing.price,
                pendingPrice: newPrice,
                priceChangeReason: reason,
                updatedAt: new Date(),
            })
            .where(eq(menuItems.id, id))
            .returning();

        res.json({ ...updated[0], message: 'Price change requested, awaiting approval' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Approve a pending price change (applies the new price)
 * POST /api/menu/items/:id/approve-price
 */
export const approvePriceChange = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'ITEM_ID_REQUIRED' });

        const userId = (req as any).user?.id;

        const [existing] = await db.select().from(menuItems).where(eq(menuItems.id, id));
        if (!existing) return res.status(404).json({ error: 'Item not found' });
        if (!existing.pendingPrice) return res.status(400).json({ error: 'NO_PENDING_PRICE_CHANGE' });

        const updated = await db.update(menuItems)
            .set({
                price: existing.pendingPrice,
                pendingPrice: null,
                priceApprovedBy: userId,
                priceApprovedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(menuItems.id, id))
            .returning();

        res.json({ ...updated[0], message: 'Price change approved and applied' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get items pending approval or with pending price changes
 * GET /api/menu/items/pending
 */
export const getPendingItems = async (req: Request, res: Response) => {
    try {
        const pendingApproval = await db.select().from(menuItems)
            .where(eq(menuItems.status, 'pending_approval'));

        const pendingPriceChange = await db.select().from(menuItems)
            .where(and(
                eq(menuItems.status, 'published'),
                // Filter where pendingPrice is not null - using raw check
            ));

        // Filter in JS for pending price since Drizzle doesn't have isNotNull easily
        const withPendingPrice = pendingPriceChange.filter(item => item.pendingPrice !== null);

        res.json({
            pendingApproval,
            pendingPriceChange: withPendingPrice,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// --- CSV Import/Export ---

/**
 * Export menu items as CSV
 * GET /api/menu/items/export
 */
export const exportItemsCSV = async (req: Request, res: Response) => {
    try {
        const items = await db.select().from(menuItems).orderBy(menuItems.sortOrder);
        const categories = await db.select().from(menuCategories);

        const categoryMap = new Map(categories.map(c => [c.id, c.name]));

        // CSV Header
        const headers = [
            'id', 'name', 'nameAr', 'categoryId', 'categoryName',
            'price', 'cost', 'description', 'status', 'isAvailable',
            'preparationTime', 'isPopular', 'isFeatured', 'sortOrder'
        ];

        const csvLines = [headers.join(',')];

        for (const item of items) {
            const row = [
                item.id,
                `"${(item.name || '').replace(/"/g, '""')}"`,
                `"${(item.nameAr || '').replace(/"/g, '""')}"`,
                item.categoryId || '',
                `"${categoryMap.get(item.categoryId || '') || ''}"`,
                item.price,
                item.cost || 0,
                `"${(item.description || '').replace(/"/g, '""')}"`,
                item.status || 'published',
                item.isAvailable ? 'true' : 'false',
                item.preparationTime || 15,
                item.isPopular ? 'true' : 'false',
                item.isFeatured ? 'true' : 'false',
                item.sortOrder || 0,
            ];
            csvLines.push(row.join(','));
        }

        const csv = csvLines.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=menu_items.csv');
        res.send(csv);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Import menu items from CSV
 * POST /api/menu/items/import
 */
export const importItemsCSV = async (req: Request, res: Response) => {
    try {
        const { csvData, updateExisting = false } = req.body;

        if (!csvData) {
            return res.status(400).json({ error: 'CSV_DATA_REQUIRED' });
        }

        const lines = csvData.split('\n').filter((l: string) => l.trim());
        if (lines.length < 2) {
            return res.status(400).json({ error: 'INVALID_CSV_FORMAT' });
        }

        // Parse header
        const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
        const nameIndex = headers.indexOf('name');
        const priceIndex = headers.indexOf('price');

        if (nameIndex === -1 || priceIndex === -1) {
            return res.status(400).json({ error: 'REQUIRED_COLUMNS_MISSING', required: ['name', 'price'] });
        }

        // Get categories for lookup
        const categories = await db.select().from(menuCategories);
        const categoryByName = new Map(categories.map(c => [(c.name || '').toLowerCase(), c.id]));

        const results = { created: 0, updated: 0, errors: [] as string[] };

        for (let i = 1; i < lines.length; i++) {
            try {
                // Simple CSV parse (doesn't handle all edge cases)
                const values = parseCSVLine(lines[i]);

                const getValue = (header: string) => {
                    const idx = headers.indexOf(header.toLowerCase());
                    return idx !== -1 ? values[idx]?.trim() : undefined;
                };

                const id = getValue('id') || `item-${Date.now()}-${i}`;
                const name = getValue('name');
                const price = parseFloat(getValue('price') || '0');

                if (!name || isNaN(price)) {
                    results.errors.push(`Row ${i + 1}: Missing name or invalid price`);
                    continue;
                }

                // Resolve category
                let categoryId = getValue('categoryid');
                const categoryName = getValue('categoryname');
                if (!categoryId && categoryName) {
                    categoryId = categoryByName.get(categoryName.toLowerCase());
                }

                const itemData = {
                    id,
                    name,
                    nameAr: getValue('namear') || null,
                    categoryId: categoryId || null,
                    price,
                    cost: parseFloat(getValue('cost') || '0'),
                    description: getValue('description') || null,
                    status: getValue('status') || 'draft',
                    isAvailable: getValue('isavailable') !== 'false',
                    preparationTime: parseInt(getValue('preparationtime') || '15'),
                    isPopular: getValue('ispopular') === 'true',
                    isFeatured: getValue('isfeatured') === 'true',
                    sortOrder: parseInt(getValue('sortorder') || '0'),
                };

                // Check if exists
                const [existing] = await db.select().from(menuItems).where(eq(menuItems.id, id));

                if (existing) {
                    if (updateExisting) {
                        await db.update(menuItems)
                            .set({ ...itemData, updatedAt: new Date() })
                            .where(eq(menuItems.id, id));
                        results.updated++;
                    } else {
                        results.errors.push(`Row ${i + 1}: Item ${id} already exists`);
                    }
                } else {
                    await db.insert(menuItems).values({
                        ...itemData,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    results.created++;
                }
            } catch (err: any) {
                results.errors.push(`Row ${i + 1}: ${err.message}`);
            }
        }

        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Simple CSV line parser
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);

    return result;
}
