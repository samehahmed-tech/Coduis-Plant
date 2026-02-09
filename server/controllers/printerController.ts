import { Request, Response } from 'express';
import { db } from '../db';
import { printers } from '../../src/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { getStringParam } from '../utils/request';
import net from 'node:net';

export const getPrinters = async (req: Request, res: Response) => {
    try {
        const branchId = getStringParam(req.query.branchId);
        const active = getStringParam(req.query.active);

        const conditions: any[] = [];
        if (branchId) conditions.push(eq(printers.branchId, branchId));
        if (active === 'true') conditions.push(eq(printers.isActive, true));

        const base = db.select().from(printers);
        const query = conditions.length ? base.where(and(...conditions)) : base;
        const all = await query.orderBy(desc(printers.createdAt));

        res.json(all);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getPrinterById = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'PRINTER_ID_REQUIRED' });

        const [printer] = await db.select().from(printers).where(eq(printers.id, id));
        if (!printer) return res.status(404).json({ error: 'Printer not found' });

        res.json(printer);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createPrinter = async (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        if (!body.name || !body.type) {
            return res.status(400).json({ error: 'name and type are required' });
        }

        const [created] = await db.insert(printers).values({
            id: body.id || `PRN-${Date.now()}`,
            name: body.name,
            type: body.type,
            address: body.address || '',
            location: body.location || '',
            branchId: body.branch_id || body.branchId || null,
            isActive: body.is_active !== false,
            paperWidth: body.paper_width ?? 80,
            createdAt: new Date(),
        }).returning();

        res.status(201).json(created);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updatePrinter = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'PRINTER_ID_REQUIRED' });
        const body = req.body || {};

        const [updated] = await db.update(printers)
            .set({
                name: body.name,
                type: body.type,
                address: body.address,
                location: body.location,
                branchId: body.branch_id || body.branchId,
                isActive: body.is_active,
                paperWidth: body.paper_width,
            })
            .where(eq(printers.id, id))
            .returning();

        if (!updated) return res.status(404).json({ error: 'Printer not found' });
        res.json(updated);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deletePrinter = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'PRINTER_ID_REQUIRED' });

        const [deleted] = await db.delete(printers).where(eq(printers.id, id)).returning();
        if (!deleted) return res.status(404).json({ error: 'Printer not found' });

        res.json({ success: true, printer: deleted });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

const probeNetworkPrinter = (address: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const [hostRaw, portRaw] = String(address || '').split(':');
        const host = hostRaw?.trim();
        const port = Number(portRaw || 9100);
        if (!host || Number.isNaN(port)) return resolve(false);

        const socket = new net.Socket();
        const timeout = setTimeout(() => {
            socket.destroy();
            resolve(false);
        }, 1500);

        socket.once('connect', () => {
            clearTimeout(timeout);
            socket.destroy();
            resolve(true);
        });
        socket.once('error', () => {
            clearTimeout(timeout);
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, host);
    });
};

export const heartbeatPrinter = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'PRINTER_ID_REQUIRED' });
        const [printer] = await db.select().from(printers).where(eq(printers.id, id));
        if (!printer) return res.status(404).json({ error: 'Printer not found' });

        let online = false;
        if (printer.type === 'NETWORK') {
            online = await probeNetworkPrinter(printer.address || '');
        } else {
            // Local printers require local bridge health check.
            online = Boolean(printer.isActive);
        }

        const [updated] = await db.update(printers)
            .set({ isActive: online })
            .where(eq(printers.id, id))
            .returning();

        res.json({ id, online, printer: updated });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
