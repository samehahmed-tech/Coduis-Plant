import { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../../src/db/schema';
import { eq, desc } from 'drizzle-orm';

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
        const user = await db.select().from(users).where(eq(users.id, req.params.id));
        if (user.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(user[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const newUser = await db.insert(users).values({
            ...req.body,
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
        const updatedUser = await db.update(users)
            .set({ ...req.body, updatedAt: new Date() })
            .where(eq(users.id, req.params.id))
            .returning();
        if (updatedUser.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(updatedUser[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const deletedUser = await db.delete(users).where(eq(users.id, req.params.id)).returning();
        if (deletedUser.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted', user: deletedUser[0] });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
