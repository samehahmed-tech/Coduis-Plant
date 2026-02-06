import { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../../src/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getStringParam } from '../utils/request';

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
        res.json(allUsers);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'USER_ID_REQUIRED' });
        const user = await db.select().from(users).where(eq(users.id, id));
        if (user.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(user[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        let passwordHash = body.password_hash || body.passwordHash;
        if (body.password) {
            const bcrypt = await import('bcryptjs');
            passwordHash = await bcrypt.hash(body.password, 10);
        }

        const newUser = await db.insert(users).values({
            id: body.id,
            name: body.name,
            email: body.email,
            role: body.role,
            permissions: body.permissions,
            assignedBranchId: body.assigned_branch_id || body.assignedBranchId,
            isActive: body.is_active !== false,
            managerPin: body.manager_pin || body.managerPin,
            passwordHash,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();
        res.status(201).json(newUser[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const body = req.body || {};
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'USER_ID_REQUIRED' });
        let passwordHash = body.password_hash || body.passwordHash;
        if (body.password) {
            const bcrypt = await import('bcryptjs');
            passwordHash = await bcrypt.hash(body.password, 10);
        }
        const updatedUser = await db.update(users)
            .set({
                name: body.name,
                email: body.email,
                role: body.role,
                permissions: body.permissions,
                assignedBranchId: body.assigned_branch_id || body.assignedBranchId,
                isActive: body.is_active !== undefined ? body.is_active : undefined,
                managerPin: body.manager_pin || body.managerPin,
                passwordHash,
                updatedAt: new Date()
            })
            .where(eq(users.id, id))
            .returning();
        if (updatedUser.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(updatedUser[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const id = getStringParam((req.params as any).id);
        if (!id) return res.status(400).json({ error: 'USER_ID_REQUIRED' });
        const deletedUser = await db.delete(users).where(eq(users.id, id)).returning();
        if (deletedUser.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted', user: deletedUser[0] });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
