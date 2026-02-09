import { Request, Response } from 'express';
import { db } from '../db';
import { deliveryZones, drivers, orders } from '../../src/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getIO } from '../socket';
import { getStringParam } from '../utils/request';

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
        const conditions: any[] = [eq(drivers.status, 'AVAILABLE'), eq(drivers.isActive, true)];
        if (branchId) conditions.push(eq(drivers.branchId, branchId as string));
        const availableDrivers = await db.select().from(drivers).where(and(...conditions)).orderBy(desc(drivers.createdAt));
        res.json(availableDrivers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getDrivers = async (req: Request, res: Response) => {
    try {
        const { branchId, status } = req.query;
        const conditions: any[] = [eq(drivers.isActive, true)];
        if (branchId) conditions.push(eq(drivers.branchId, branchId as string));
        if (status) conditions.push(eq(drivers.status, status as string));
        const allDrivers = await db.select().from(drivers).where(and(...conditions)).orderBy(desc(drivers.createdAt));
        res.json(allDrivers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateDriverStatus = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'DRIVER_ID_REQUIRED' });
        const { status } = req.body || {};
        const [updated] = await db.update(drivers).set({ status }).where(eq(drivers.id, id)).returning();
        if (!updated) return res.status(404).json({ error: 'Driver not found' });
        try {
            const branchRoom = updated.branchId ? `branch:${updated.branchId}` : null;
            if (branchRoom) getIO().to(branchRoom).emit('driver:status', { id: updated.id, status: updated.status });
        } catch {
            // socket optional
        }
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const assignDriver = async (req: Request, res: Response) => {
    try {
        const { orderId, driverId } = req.body;
        let orderBranchId: string | null = null;
        await db.transaction(async (tx) => {
            // 1. Update Order
            const [updatedOrder] = await tx.update(orders)
                .set({ driverId, status: 'OUT_FOR_DELIVERY', updatedAt: new Date() })
                .where(eq(orders.id, orderId))
                .returning();
            orderBranchId = updatedOrder?.branchId || null;

            // 2. Update Driver status
            await tx.update(drivers)
                .set({ status: 'BUSY' })
                .where(eq(drivers.id, driverId));
        });

        try {
            const branchRoom = orderBranchId ? `branch:${orderBranchId}` : null;
            if (branchRoom) {
                getIO().to(branchRoom).emit('dispatch:assigned', { orderId, driverId });
                getIO().to(branchRoom).emit('order:status', { id: orderId, status: 'OUT_FOR_DELIVERY' });
                getIO().to(branchRoom).emit('driver:status', { id: driverId, status: 'BUSY' });
            }
        } catch {
            // socket optional
        }

        res.json({ message: 'Driver assigned successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
