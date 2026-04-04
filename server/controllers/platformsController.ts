import { Request, Response } from 'express';
import { db } from '../db';
import { deliveryPlatforms } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const getPlatforms = async (_req: Request, res: Response) => {
    try {
        const platforms = await db.query.deliveryPlatforms.findMany({
            orderBy: (platforms, { desc }) => [desc(platforms.createdAt)],
        });
        res.json(platforms);
    } catch (error: any) {
        console.error('Error fetching delivery platforms:', error);
        res.status(500).json({ error: 'Failed to fetch platforms' });
    }
};

export const createPlatform = async (req: Request, res: Response) => {
    try {
        const body = req.body || {};

        const [created] = await db.insert(deliveryPlatforms).values({
            id: body.id || `PLAT-${nanoid(8)}`,
            name: body.name || 'New Platform',
            isActive: body.isActive !== undefined ? body.isActive : true,
            feePercentage: Number(body.feePercentage || 0),
            integrationType: body.integrationType || 'MANUAL',
        }).returning();

        res.status(201).json(created);
    } catch (error: any) {
        console.error('Error creating delivery platform:', error);
        res.status(500).json({ error: 'Failed to create platform' });
    }
};

export const updatePlatform = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const body = req.body || {};

        const [updated] = await db.update(deliveryPlatforms).set({
            name: body.name,
            isActive: body.isActive,
            feePercentage: body.feePercentage !== undefined ? Number(body.feePercentage) : undefined,
            integrationType: body.integrationType,
            updatedAt: new Date(),
        })
            .where(eq(deliveryPlatforms.id, id))
            .returning();

        if (!updated) return res.status(404).json({ error: 'Platform not found' });

        res.json(updated);
    } catch (error: any) {
        console.error('Error updating delivery platform:', error);
        res.status(500).json({ error: 'Failed to update platform' });
    }
};

export const deletePlatform = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        // Check if there are active menu items targeting this platform? Not strictly enforced at DB level now, 
        // as targetPlatforms are in JSON arrays on menu categories/items. 
        // We'll just softly delete it or actually delete it since it's configuration.
        await db.delete(deliveryPlatforms).where(eq(deliveryPlatforms.id, id));
        res.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting delivery platform:', error);
        res.status(500).json({ error: 'Failed to delete platform' });
    }
};
