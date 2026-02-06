import { Request, Response } from 'express';
import { db } from '../db';
import { branches } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import { getStringParam } from '../utils/request';

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
        const body = req.body || {};
        const newBranch = await db.insert(branches).values({
            id: body.id,
            name: body.name,
            nameAr: body.name_ar || body.nameAr,
            location: body.location,
            address: body.address,
            phone: body.phone,
            email: body.email,
            isActive: body.is_active !== false,
            timezone: body.timezone,
            currency: body.currency,
            taxRate: body.tax_rate ?? body.taxRate,
            serviceCharge: body.service_charge ?? body.serviceCharge,
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
        const body = req.body || {};
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'BRANCH_ID_REQUIRED' });
        const updatedBranch = await db.update(branches)
            .set({
                name: body.name,
                nameAr: body.name_ar || body.nameAr,
                location: body.location,
                address: body.address,
                phone: body.phone,
                email: body.email,
                isActive: body.is_active !== undefined ? body.is_active : undefined,
                timezone: body.timezone,
                currency: body.currency,
                taxRate: body.tax_rate ?? body.taxRate,
                serviceCharge: body.service_charge ?? body.serviceCharge,
                updatedAt: new Date()
            })
            .where(eq(branches.id, id))
            .returning();
        res.json(updatedBranch[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteBranch = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'BRANCH_ID_REQUIRED' });
        await db.delete(branches).where(eq(branches.id, id));
        res.json({ message: 'Branch deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
