import { Request, Response } from 'express';
import { db } from '../db';
import { suppliers } from '../../src/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Get all suppliers
 */
export const getSuppliers = async (req: Request, res: Response) => {
    try {
        const { active } = req.query;

        let query = db.select().from(suppliers).orderBy(desc(suppliers.createdAt));

        if (active === 'true') {
            query = query.where(eq(suppliers.isActive, true));
        }

        const allSuppliers = await query;
        res.json(allSuppliers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get single supplier by ID
 */
export const getSupplierById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));

        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json(supplier);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Create new supplier
 */
export const createSupplier = async (req: Request, res: Response) => {
    try {
        const { id, name, contactPerson, phone, email, address, category, paymentTerms, notes } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Supplier name is required' });
        }

        const [newSupplier] = await db.insert(suppliers).values({
            id: id || `SUP-${Date.now()}`,
            name,
            contactPerson,
            phone,
            email,
            address,
            category,
            paymentTerms,
            notes,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        res.status(201).json(newSupplier);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update supplier
 */
export const updateSupplier = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const [updated] = await db.update(suppliers)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(eq(suppliers.id, id))
            .returning();

        if (!updated) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Deactivate supplier (soft delete)
 */
export const deactivateSupplier = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const [updated] = await db.update(suppliers)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(suppliers.id, id))
            .returning();

        if (!updated) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json({ success: true, message: 'Supplier deactivated' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
