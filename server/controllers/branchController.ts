import { Request, Response } from 'express';
import { db } from '../db';
import { branches } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

export const getAllBranches = async (req: Request, res: Response) => {
    try {
        const allBranches = await db.select().from(branches).orderBy(branches.name);
        res.json(allBranches);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createBranch = async (req: Request, res: Response) => {
    try {
        const newBranch = await db.insert(branches).values({
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();
        res.status(201).json(newBranch[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateBranch = async (req: Request, res: Response) => {
    try {
        const updatedBranch = await db.update(branches)
            .set({ ...req.body, updatedAt: new Date() })
            .where(eq(branches.id, req.params.id))
            .returning();
        res.json(updatedBranch[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteBranch = async (req: Request, res: Response) => {
    try {
        await db.delete(branches).where(eq(branches.id, req.params.id));
        res.json({ message: 'Branch deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
