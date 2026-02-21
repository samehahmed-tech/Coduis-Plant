import { Request, Response } from 'express';
import { db } from '../db';
import { users, userSessions } from '../../src/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getStringParam } from '../utils/request';
import { getIO } from '../socket';

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

        let pinCodeHash: string | undefined;
        let pinLoginEnabled = false;
        if (body.pin) {
            const bcrypt = await import('bcryptjs');
            pinCodeHash = await bcrypt.hash(String(body.pin), 10);
            pinLoginEnabled = true;
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
            pinCodeHash,
            pinLoginEnabled,
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
        const [existingUser] = await db.select().from(users).where(eq(users.id, id));
        if (!existingUser) return res.status(404).json({ error: 'User not found' });

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

        const changedRole = existingUser.role !== updatedUser[0].role;
        const changedActive = existingUser.isActive !== updatedUser[0].isActive;
        const changedPermissions = JSON.stringify(existingUser.permissions || []) !== JSON.stringify(updatedUser[0].permissions || []);

        if (changedRole || changedActive || changedPermissions) {
            // Revoke all active database sessions for this user
            await db.update(userSessions)
                .set({
                    isActive: false,
                    revokedAt: new Date(),
                })
                .where(and(
                    eq(userSessions.userId, id),
                    eq(userSessions.isActive, true)
                ));

            // Emit socket event for real-time logout
            try {
                getIO().to(`user:${id}`).emit('security:session-revoked', {
                    userId: id,
                    reason: changedActive === false ? 'USER_DISABLED' : 'ROLE_OR_PERMISSION_CHANGED',
                    changedAt: new Date().toISOString(),
                });
            } catch {
                // socket optional
            }
        }

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
