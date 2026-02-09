import { Request, Response } from 'express';
import { db } from '../db';
import { users, userSessions } from '../../src/db/schema';
import { and, eq, ne, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { requireEnv } from '../config/env';
import { getLoginThrottleState, registerLoginFailure, registerLoginSuccess } from '../services/loginProtectionService';
import { createSignedAuditLog } from '../services/auditLogService';
import crypto from 'crypto';
import { buildOtpAuthUri, generateBase32Secret, verifyTotp } from '../services/totpService';

const JWT_SECRET = requireEnv('JWT_SECRET');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
const AUTH_SESSION_TTL_HOURS = Number(process.env.AUTH_SESSION_TTL_HOURS || 12);
const AUTH_MFA_ISSUER = process.env.AUTH_MFA_ISSUER || 'RestoFlow ERP';
const AUTH_MFA_ENFORCE_ADMIN_FINANCE = process.env.AUTH_MFA_ENFORCE_ADMIN_FINANCE === 'true';

const parseJwtExpiryMs = (value: string): number => {
    const normalized = String(value || '').trim();
    const match = normalized.match(/^(\d+)([smhd])?$/i);
    if (!match) return 12 * 60 * 60 * 1000;
    const amount = Number(match[1]);
    const unit = (match[2] || 's').toLowerCase();
    if (unit === 'm') return amount * 60 * 1000;
    if (unit === 'h') return amount * 60 * 60 * 1000;
    if (unit === 'd') return amount * 24 * 60 * 60 * 1000;
    return amount * 1000;
};

const sanitizeUser = (u: any) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    permissions: u.permissions || [],
    assignedBranchId: u.assignedBranchId,
    isActive: u.isActive !== false,
    mfaEnabled: u.mfaEnabled === true,
});

const getSessionExpiry = (): Date => {
    const jwtMs = parseJwtExpiryMs(JWT_EXPIRES_IN);
    const sessionMs = AUTH_SESSION_TTL_HOURS > 0 ? AUTH_SESSION_TTL_HOURS * 60 * 60 * 1000 : jwtMs;
    return new Date(Date.now() + Math.min(jwtMs, sessionMs));
};

const writeAuthAudit = async (input: Parameters<typeof createSignedAuditLog>[0]) => {
    try {
        await createSignedAuditLog(input);
    } catch {
        // Do not block auth flow if audit insert fails.
    }
};

const issueAccessToken = async (user: any, req: Request, deviceName?: string) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const tokenId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const expiresAt = getSessionExpiry();

    await db.insert(userSessions).values({
        id: sessionId,
        userId: user.id,
        tokenId,
        deviceName: deviceName || null,
        userAgent: req.headers['user-agent'] || null,
        ipAddress: clientIp,
        isActive: true,
        expiresAt,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
    });

    await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));

    const token = jwt.sign({
        id: user.id,
        role: user.role,
        permissions: user.permissions || [],
        branchId: user.assignedBranchId,
        sid: sessionId,
        jti: tokenId,
    }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, subject: user.id });

    return token;
};

const roleRequiresMfa = (role: string): boolean => role === 'SUPER_ADMIN' || role === 'FINANCE';
const shouldRequireMfa = (user: any): boolean => user.mfaEnabled === true || (AUTH_MFA_ENFORCE_ADMIN_FINANCE && roleRequiresMfa(user.role));

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body || {};
        const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
        const normalizedEmail = String(email || '').trim().toLowerCase();

        const throttle = getLoginThrottleState(clientIp, normalizedEmail);
        if (throttle.blocked) {
            await writeAuthAudit({
                eventType: 'auth.login.blocked',
                ipAddress: clientIp,
                payload: { email: normalizedEmail, retryAfterSeconds: throttle.retryAfterSeconds },
                reason: 'TOO_MANY_LOGIN_ATTEMPTS',
            });
            res.setHeader('Retry-After', String(throttle.retryAfterSeconds));
            return res.status(429).json({
                error: 'TOO_MANY_LOGIN_ATTEMPTS',
                retryAfterSeconds: throttle.retryAfterSeconds,
            });
        }

        if (!email || !password) {
            registerLoginFailure(clientIp, normalizedEmail);
            await writeAuthAudit({
                eventType: 'auth.login.failed',
                ipAddress: clientIp,
                payload: { email: normalizedEmail },
                reason: 'MISSING_CREDENTIALS',
            });
            return res.status(400).json({ error: 'email and password are required' });
        }

        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user || user.isActive === false) {
            registerLoginFailure(clientIp, email);
            await writeAuthAudit({
                eventType: 'auth.login.failed',
                ipAddress: clientIp,
                payload: { email: normalizedEmail },
                reason: 'INVALID_CREDENTIALS',
            });
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
            registerLoginFailure(clientIp, email);
            await writeAuthAudit({
                eventType: 'auth.login.failed',
                userId: user.id,
                userName: user.name,
                userRole: user.role,
                branchId: user.assignedBranchId,
                ipAddress: clientIp,
                payload: { email: normalizedEmail },
                reason: 'INVALID_CREDENTIALS',
            });
            return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
        }

        const deviceName = String(req.body?.deviceName || req.body?.device_name || '').trim() || undefined;
        registerLoginSuccess(clientIp, email);

        if (shouldRequireMfa(user)) {
            if (!user.mfaEnabled || !user.mfaSecret) {
                return res.status(403).json({ error: 'MFA_SETUP_REQUIRED' });
            }
            const mfaToken = jwt.sign({
                id: user.id,
                purpose: 'mfa_challenge',
                branchId: user.assignedBranchId,
                role: user.role,
            }, JWT_SECRET, { expiresIn: '5m', subject: user.id });
            await writeAuthAudit({
                eventType: 'auth.login.mfa_challenge',
                userId: user.id,
                userName: user.name,
                userRole: user.role,
                branchId: user.assignedBranchId,
                ipAddress: clientIp,
                payload: { email: normalizedEmail },
            });
            return res.json({ mfaRequired: true, mfaToken });
        }

        const token = await issueAccessToken(user, req, deviceName);

        await writeAuthAudit({
            eventType: 'auth.login.success',
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            branchId: user.assignedBranchId,
            ipAddress: clientIp,
            payload: { email: normalizedEmail },
        });

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

export const logout = async (req: Request, res: Response) => {
    try {
        const sessionId = req.user?.sessionId;
        if (!sessionId) return res.status(200).json({ ok: true });

        await db.update(userSessions)
            .set({ isActive: false, revokedAt: new Date(), updatedAt: new Date() })
            .where(eq(userSessions.id, sessionId));

        await writeAuthAudit({
            eventType: 'auth.logout',
            userId: req.user?.id,
            userRole: req.user?.role,
            branchId: req.user?.branchId || null,
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            payload: { sessionId },
        });

        return res.json({ ok: true });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const getSessions = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'AUTH_REQUIRED' });

        const rows = await db.select().from(userSessions)
            .where(eq(userSessions.userId, userId))
            .orderBy(desc(userSessions.createdAt));

        return res.json(rows.map((row) => ({
            id: row.id,
            deviceName: row.deviceName,
            userAgent: row.userAgent,
            ipAddress: row.ipAddress,
            isActive: row.isActive !== false && !row.revokedAt && new Date(row.expiresAt) > new Date(),
            createdAt: row.createdAt,
            lastSeenAt: row.lastSeenAt,
            expiresAt: row.expiresAt,
            revokedAt: row.revokedAt,
            isCurrent: row.id === req.user?.sessionId,
        })));
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const revokeSession = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const rawSessionId = req.params.id as string | string[] | undefined;
        const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;
        if (!userId) return res.status(401).json({ error: 'AUTH_REQUIRED' });
        if (!sessionId) return res.status(400).json({ error: 'SESSION_ID_REQUIRED' });

        const [session] = await db.select().from(userSessions)
            .where(and(eq(userSessions.id, sessionId), eq(userSessions.userId, userId)));
        if (!session) return res.status(404).json({ error: 'SESSION_NOT_FOUND' });

        await db.update(userSessions)
            .set({ isActive: false, revokedAt: new Date(), updatedAt: new Date() })
            .where(eq(userSessions.id, sessionId));

        await writeAuthAudit({
            eventType: 'auth.session.revoked',
            userId,
            userRole: req.user?.role,
            branchId: req.user?.branchId || null,
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            payload: { sessionId },
        });

        return res.json({ ok: true });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const revokeOtherSessions = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const currentSessionId = req.user?.sessionId;
        if (!userId || !currentSessionId) return res.status(401).json({ error: 'AUTH_REQUIRED' });

        await db.update(userSessions)
            .set({ isActive: false, revokedAt: new Date(), updatedAt: new Date() })
            .where(and(
                eq(userSessions.userId, userId),
                ne(userSessions.id, currentSessionId),
                eq(userSessions.isActive, true),
            ));

        await writeAuthAudit({
            eventType: 'auth.session.revoke_others',
            userId,
            userRole: req.user?.role,
            branchId: req.user?.branchId || null,
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            payload: { keepSessionId: currentSessionId },
        });

        return res.json({ ok: true });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const verifyMfaChallenge = async (req: Request, res: Response) => {
    try {
        const { mfaToken, code, deviceName } = req.body || {};
        if (!mfaToken || !code) return res.status(400).json({ error: 'MFA_TOKEN_AND_CODE_REQUIRED' });

        const payload = jwt.verify(mfaToken, JWT_SECRET) as { sub?: string; id?: string; purpose?: string };
        if (payload.purpose !== 'mfa_challenge') return res.status(401).json({ error: 'INVALID_MFA_TOKEN' });
        const userId = payload.sub || payload.id;
        if (!userId) return res.status(401).json({ error: 'INVALID_MFA_TOKEN' });

        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user || !user.mfaEnabled || !user.mfaSecret) return res.status(401).json({ error: 'MFA_NOT_ENABLED' });

        const valid = verifyTotp(user.mfaSecret, String(code));
        if (!valid) {
            await writeAuthAudit({
                eventType: 'auth.mfa.failed',
                userId: user.id,
                userName: user.name,
                userRole: user.role,
                branchId: user.assignedBranchId,
                ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            });
            return res.status(401).json({ error: 'INVALID_MFA_CODE' });
        }

        const token = await issueAccessToken(user, req, String(deviceName || '').trim() || undefined);
        await writeAuthAudit({
            eventType: 'auth.mfa.verified',
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            branchId: user.assignedBranchId,
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        });
        return res.json({ token, user: sanitizeUser(user) });
    } catch {
        return res.status(401).json({ error: 'INVALID_MFA_TOKEN' });
    }
};

export const initiateMfaSetup = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'AUTH_REQUIRED' });
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

        const secret = generateBase32Secret(32);
        const setupToken = jwt.sign({
            id: userId,
            purpose: 'mfa_setup',
            secret,
        }, JWT_SECRET, { expiresIn: '10m', subject: userId });
        const otpAuthUrl = buildOtpAuthUri(AUTH_MFA_ISSUER, user.email, secret);
        return res.json({ setupToken, secret, otpAuthUrl });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};

export const confirmMfaSetup = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { setupToken, code } = req.body || {};
        if (!userId) return res.status(401).json({ error: 'AUTH_REQUIRED' });
        if (!setupToken || !code) return res.status(400).json({ error: 'SETUP_TOKEN_AND_CODE_REQUIRED' });

        const payload = jwt.verify(setupToken, JWT_SECRET) as { sub?: string; id?: string; purpose?: string; secret?: string };
        if (payload.purpose !== 'mfa_setup' || (payload.sub || payload.id) !== userId || !payload.secret) {
            return res.status(401).json({ error: 'INVALID_SETUP_TOKEN' });
        }
        if (!verifyTotp(payload.secret, String(code))) return res.status(401).json({ error: 'INVALID_MFA_CODE' });

        await db.update(users).set({ mfaEnabled: true, mfaSecret: payload.secret, updatedAt: new Date() }).where(eq(users.id, userId));
        await writeAuthAudit({
            eventType: 'auth.mfa.enabled',
            userId,
            userRole: req.user?.role,
            branchId: req.user?.branchId || null,
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        });
        return res.json({ ok: true });
    } catch {
        return res.status(401).json({ error: 'INVALID_SETUP_TOKEN' });
    }
};

export const disableMfa = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { code } = req.body || {};
        if (!userId) return res.status(401).json({ error: 'AUTH_REQUIRED' });
        if (!code) return res.status(400).json({ error: 'MFA_CODE_REQUIRED' });

        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user || !user.mfaEnabled || !user.mfaSecret) return res.status(400).json({ error: 'MFA_NOT_ENABLED' });
        if (!verifyTotp(user.mfaSecret, String(code))) return res.status(401).json({ error: 'INVALID_MFA_CODE' });

        await db.update(users).set({ mfaEnabled: false, mfaSecret: null, updatedAt: new Date() }).where(eq(users.id, userId));
        await writeAuthAudit({
            eventType: 'auth.mfa.disabled',
            userId,
            userRole: req.user?.role,
            branchId: req.user?.branchId || null,
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        });
        return res.json({ ok: true });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
};
