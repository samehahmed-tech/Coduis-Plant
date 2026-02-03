import { Request, Response } from 'express';
import { db } from '../db';
import { tables, floorZones } from '../../src/db/schema';
import { eq, and } from 'drizzle-orm';

export const getTables = async (req: Request, res: Response) => {
    try {
        const branchId = req.query.branchId as string;
        if (!branchId) return res.status(400).json({ error: 'Branch ID required' });

        const allTables = await db.select().from(tables).where(eq(tables.branchId, branchId));
        res.json(allTables);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getZones = async (req: Request, res: Response) => {
    try {
        const branchId = req.query.branchId as string;
        if (!branchId) return res.status(400).json({ error: 'Branch ID required' });

        const allZones = await db.select().from(floorZones).where(eq(floorZones.branchId, branchId));
        res.json(allZones);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const saveLayout = async (req: Request, res: Response) => {
    try {
        const { branchId, zones: zonesData, tables: tablesData } = req.body;

        await db.transaction(async (tx) => {
            // Upsert Zones
            for (const zone of zonesData) {
                await tx.insert(floorZones).values({ ...zone, branchId })
                    .onConflictDoUpdate({ target: floorZones.id, set: zone });
            }

            // Upsert Tables
            // Be careful not to overwrite status/currentOrderId if just updating layout positions
            for (const table of tablesData) {
                // We typically only update layout fields here (x, y, width, height, shape, seats, name, zoneId)
                // If the table is new, insert it.
                await tx.insert(tables).values({
                    ...table,
                    branchId,
                    status: table.status || 'AVAILABLE'
                }).onConflictDoUpdate({
                    target: tables.id,
                    set: {
                        x: table.x,
                        y: table.y,
                        width: table.width,
                        height: table.height,
                        shape: table.shape,
                        seats: table.seats,
                        name: table.name,
                        zoneId: table.zoneId,
                        updatedAt: new Date()
                    }
                });
            }
        });

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateTableStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, currentOrderId } = req.body;

        const [updatedTable] = await db.update(tables)
            .set({
                status,
                currentOrderId: currentOrderId || null,
                updatedAt: new Date()
            })
            .where(eq(tables.id, id))
            .returning();

        if (!updatedTable) return res.status(404).json({ error: 'Table not found' });

        res.json(updatedTable);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
