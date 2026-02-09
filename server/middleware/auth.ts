import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requireEnv } from '../config/env';
import { db } from '../db';
import { userSessions } from '../../src/db/schema';
import { and, eq, gt } from 'drizzle-orm';

export interface AuthUser {
    id: string;
    role: string;
    permissions: string[];
    branchId?: string | null;
    sessionId?: string;
    tokenId?: string;
}

declare global {
    // eslint-disable-next-line no-var
    var __authUser: AuthUser | undefined;
}

declare module 'express-serve-static-core' {
    interface Request {
        user?: AuthUser;
    }
}

const JWT_SECRET = requireEnv('JWT_SECRET');

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
        return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as AuthUser & { sub?: string; sid?: string; jti?: string };
        const sessionId = payload.sid || payload.sessionId;
        const tokenId = payload.jti || payload.tokenId;
        if (!sessionId || !tokenId) {
            return res.status(401).json({ error: 'INVALID_TOKEN_SESSION' });
        }

        const [session] = await db.select().from(userSessions).where(and(
            eq(userSessions.id, sessionId),
            eq(userSessions.userId, payload.sub || payload.id),
            eq(userSessions.tokenId, tokenId),
            eq(userSessions.isActive, true),
            gt(userSessions.expiresAt, new Date()),
        ));

        if (!session || session.revokedAt) {
            return res.status(401).json({ error: 'SESSION_REVOKED' });
        }

        await db.update(userSessions)
            .set({ lastSeenAt: new Date(), updatedAt: new Date() })
            .where(eq(userSessions.id, sessionId));

        req.user = {
            id: payload.sub || payload.id,
            role: payload.role,
            permissions: payload.permissions || [],
            branchId: payload.branchId,
            sessionId,
            tokenId,
        };
        return next();
    } catch {
        return res.status(401).json({ error: 'INVALID_TOKEN' });
    }
};

export const requireRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'AUTH_REQUIRED' });
        if (roles.includes(user.role)) return next();
        return res.status(403).json({ error: 'FORBIDDEN' });
    };
};

export const requirePermission = (...perms: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user) return res.status(401).json({ error: 'AUTH_REQUIRED' });
        if (user.role === 'SUPER_ADMIN') return next();
        if (user.permissions?.includes('*')) return next();
        if (perms.some(p => user.permissions?.includes(p))) return next();
        return res.status(403).json({ error: 'FORBIDDEN' });
    };
};
