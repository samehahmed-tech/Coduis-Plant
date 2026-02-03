import { Request, Response } from 'express';
import { db } from '../db';
import { menuCategories, menuItems } from '../../src/db/schema';
import { eq, and } from 'drizzle-orm';

// --- Categories ---
export const getAllCategories = async (req: Request, res: Response) => {
    try {
        const categories = await db.select().from(menuCategories)
            .where(eq(menuCategories.isActive, true))
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
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();
        res.status(201).json(category[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// --- Items ---
export const getMenuItems = async (req: Request, res: Response) => {
    try {
        const { category_id } = req.query;
        let query = db.select().from(menuItems).where(eq(menuItems.isAvailable, true));

        if (category_id) {
            // @ts-ignore
            query = query.where(eq(menuItems.categoryId, category_id as string));
        }

        const items = await query.orderBy(menuItems.sortOrder, menuItems.name);
        res.json(items);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getFullMenu = async (req: Request, res: Response) => {
    try {
        const categories = await db.select().from(menuCategories).where(eq(menuCategories.isActive, true)).orderBy(menuCategories.sortOrder);
        const items = await db.select().from(menuItems).where(eq(menuItems.isAvailable, true)).orderBy(menuItems.sortOrder);

        const fullMenu = categories.map(cat => ({
            ...cat,
            items: items.filter(item => item.categoryId === cat.id)
        }));

        res.json(fullMenu);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
