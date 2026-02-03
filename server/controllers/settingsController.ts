import { Request, Response } from 'express';
import { db } from '../db';
import { settings } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get all settings as a flat object
 */
export const getAllSettings = async (req: Request, res: Response) => {
    try {
        const allSettings = await db.select().from(settings);
        const settingsMap: Record<string, any> = {};

        allSettings.forEach(s => {
            settingsMap[s.key] = s.value;
        });

        // If empty, return default frontend-friendly structure
        if (Object.keys(settingsMap).length === 0) {
            return res.json({
                restaurantName: 'Restaurant ERP',
                currency: 'EGP',
                taxRate: 14,
                serviceCharge: 0,
                language: 'ar',
                theme: 'xen'
            });
        }

        res.json(settingsMap);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update a specific setting
 */
export const updateSetting = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const { value, category, updated_by } = req.body;

        const [updated] = await db.insert(settings)
            .values({
                key,
                value,
                category: category || 'general',
                updatedBy: updated_by,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: settings.key,
                set: {
                    value,
                    category: category || 'general',
                    updatedBy: updated_by,
                    updatedAt: new Date(),
                }
            })
            .returning();

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Bulk update settings
 */
export const updateBulkSettings = async (req: Request, res: Response) => {
    try {
        const updates = req.body;

        const operations = Object.entries(updates).map(([key, value]) => {
            return db.insert(settings)
                .values({
                    key,
                    value,
                    updatedAt: new Date(),
                })
                .onConflictDoUpdate({
                    target: settings.key,
                    set: {
                        value,
                        updatedAt: new Date(),
                    }
                });
        });

        await Promise.all(operations);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
