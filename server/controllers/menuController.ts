import { Request, Response } from 'express';
import { db } from '../db';
import { menuCategories, menuItems } from '../../src/db/schema';
import { and, eq } from 'drizzle-orm';
import { getStringParam } from '../utils/request';

// --- Categories ---
export const getAllCategories = async (req: Request, res: Response) => {
    try {
        // Get all categories - don't filter by isActive to allow viewing inactive items in admin
        const categories = await db.select().from(menuCategories)
            .orderBy(menuCategories.sortOrder, menuCategories.name);
        res.json(categories);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createCategory = async (req: Request, res: Response) => {
    try {
        const category = await db.insert(menuCategories).values({
            ...req.body,
            isActive: req.body.isActive !== false, // Default to true if not specified
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();
        res.status(201).json(category[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'CATEGORY_ID_REQUIRED' });
        const { id: _, ...updateData } = req.body; // Prevent updating ID
        const updated = await db.update(menuCategories)
            .set({ ...updateData, updatedAt: new Date() })
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
        const categories = await db.select().from(menuCategories)
            .orderBy(menuCategories.sortOrder);

        // Get items - filter by availability only if requested (for POS)
        let items;
        if (available_only === 'true') {
            items = await db.select().from(menuItems)
                .where(eq(menuItems.isAvailable, true))
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

