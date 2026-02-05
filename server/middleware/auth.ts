import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
    id: string;
    role: string;
    permissions: string[];
    branchId?: string | null;
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

const JWT_SECRET = process.env.JWT_SECRET || 'restoflow-dev-secret';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
        return res.status(401).json({ error: 'AUTH_REQUIRED' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as AuthUser & { sub?: string };
        req.user = {
            id: payload.sub || payload.id,
            role: payload.role,
            permissions: payload.permissions || [],
            branchId: payload.branchId,
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
