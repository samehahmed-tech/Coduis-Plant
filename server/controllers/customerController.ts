import { Request, Response } from 'express';
import { db } from '../db';
import { customers, customerAddresses } from '../../src/db/schema';
import { eq, or, ilike, and } from 'drizzle-orm';

/**
 * Get all customers with optional search
 */
export const getAllCustomers = async (req: Request, res: Response) => {
    try {
        const { search, phone } = req.query;

        // Simple search logic
        const query = db.select().from(customers);

        if (phone) {
            const results = await query.where(eq(customers.phone, phone as string));
            return res.json(results);
        }

        if (search) {
            const results = await query.where(
                or(
                    ilike(customers.name, `%${search}%`),
                    ilike(customers.phone, `%${search}%`),
                    ilike(customers.email, `%${search}%`)
                )
            );
            return res.json(results);
        }

        const results = await query.limit(100);
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get customer by phone
 */
export const getCustomerByPhone = async (req: Request, res: Response) => {
    try {
        const { phone } = req.params;
        const [customer] = await db.select().from(customers).where(eq(customers.phone, phone));

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Get addresses
        const addresses = await db.select().from(customerAddresses).where(eq(customerAddresses.customerId, customer.id));

        res.json({ ...customer, addresses });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Create customer
 */
export const createCustomer = async (req: Request, res: Response) => {
    try {
        const customerData = req.body;

        const [newCustomer] = await db.insert(customers).values({
            id: customerData.id || `CUS-${Date.now()}`,
            name: customerData.name,
            phone: customerData.phone,
            email: customerData.email,
            address: customerData.address,
            area: customerData.area,
            building: customerData.building,
            floor: customerData.floor,
            apartment: customerData.apartment,
            landmark: customerData.landmark,
            notes: customerData.notes,
            visits: customerData.visits || 0,
            totalSpent: customerData.total_spent ?? customerData.totalSpent ?? 0,
            loyaltyTier: customerData.loyalty_tier || customerData.loyaltyTier || 'Bronze',
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        res.status(201).json(newCustomer);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update customer
 */
export const updateCustomer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const body = req.body || {};

        const updates: any = {
            name: body.name,
            phone: body.phone,
            email: body.email,
            address: body.address,
            area: body.area,
            building: body.building,
            floor: body.floor,
            apartment: body.apartment,
            landmark: body.landmark,
            notes: body.notes,
            visits: body.visits,
            totalSpent: body.total_spent ?? body.totalSpent,
            loyaltyTier: body.loyalty_tier ?? body.loyaltyTier,
        };

        const [updated] = await db.update(customers)
            .set({
                ...updates,
                updatedAt: new Date(),
            })
            .where(eq(customers.id, id))
            .returning();

        if (!updated) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Delete customer
 */
export const deleteCustomer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await db.transaction(async (tx) => {
            await tx.delete(customerAddresses).where(eq(customerAddresses.customerId, id));
            const [deleted] = await tx.delete(customers).where(eq(customers.id, id)).returning();
            return deleted;
        });

        if (!result) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted', customer: result });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
