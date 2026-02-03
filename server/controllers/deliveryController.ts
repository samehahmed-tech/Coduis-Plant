import { Request, Response } from 'express';
import { db } from '../db';
import { deliveryZones, drivers, orders } from '../../src/db/schema';
import { eq, and } from 'drizzle-orm';

export const getAllZones = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.query;
        let query = db.select().from(deliveryZones).where(eq(deliveryZones.isActive, true));
        if (branchId) {
            // @ts-ignore
            query = query.where(eq(deliveryZones.branchId, branchId as string));
        }
        const zones = await query.orderBy(deliveryZones.name);
        res.json(zones);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getAvailableDrivers = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.query;
        const availableDrivers = await db.select().from(drivers).where(
            and(
                eq(drivers.status, 'AVAILABLE'),
                eq(drivers.isActive, true),
                branchId ? eq(drivers.branchId, branchId as string) : undefined
            )
        );
        res.json(availableDrivers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const assignDriver = async (req: Request, res: Response) => {
    try {
        const { orderId, driverId } = req.body;

        await db.transaction(async (tx) => {
            // 1. Update Order
            await tx.update(orders)
                .set({ driverId, status: 'OUT_FOR_DELIVERY', updatedAt: new Date() })
                .where(eq(orders.id, orderId));

            // 2. Update Driver status
            await tx.update(drivers)
                .set({ status: 'BUSY' })
                .where(eq(drivers.id, driverId));
        });

        res.json({ message: 'Driver assigned successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
