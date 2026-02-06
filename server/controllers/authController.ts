import { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../../src/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { requireEnv } from '../config/env';

const JWT_SECRET = requireEnv('JWT_SECRET');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

const sanitizeUser = (u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    permissions: u.permissions || [],
    assignedBranchId: u.assignedBranchId,
    isActive: u.isActive !== false,
});

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: 'email and password are required' });
        }

        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user || user.isActive === false) {
            return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
        }

        // First-time password setup if hash is missing
        if (!user.passwordHash) {
            if (String(password).length < 6) {
                return res.status(400).json({ error: 'PASSWORD_TOO_SHORT' });
            }
            const hash = await bcrypt.hash(password, 10);
            await db.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, user.id));
            user.passwordHash = hash;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash || '');
        if (!isValid) {
            return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
        }

        const token = jwt.sign({
            id: user.id,
            role: user.role,
            permissions: user.permissions || [],
            branchId: user.assignedBranchId,
        }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, subject: user.id });

        res.json({
            token,
            user: sanitizeUser(user),
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const me = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'AUTH_REQUIRED' });

        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

        res.json({ user: sanitizeUser(user) });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
