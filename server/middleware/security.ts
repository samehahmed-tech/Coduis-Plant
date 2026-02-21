/**
 * Security Middleware — Helmet, Rate Limiting, Input Sanitization
 * Implements: API Protection section of the security checklist
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// =============================================================================
// Helmet — Security Headers
// =============================================================================

export const helmetMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'", "wss:", "ws:"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow external images
    crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// =============================================================================
// Rate Limiting
// =============================================================================

const isDev = process.env.NODE_ENV !== 'production';

/** General API rate limit: 300 requests per minute per IP (disabled in dev) */
export const generalRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: isDev ? 10000 : 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down.',
    },
});

/** Auth endpoints: 20 requests per 15 minutes per IP (disabled in dev) */
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 10000 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        code: 'TOO_MANY_LOGIN_ATTEMPTS',
        message: 'Too many login attempts. Please try again later.',
    },
});

/** Report/export endpoints: 10 requests per minute */
export const reportRateLimit = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many report requests. Please wait.',
    },
});

// =============================================================================
// Input Sanitization
// =============================================================================

const DANGEROUS_PATTERNS = [
    /<script[\s>]/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
];

function sanitizeValue(value: any): any {
    if (typeof value === 'string') {
        // Check for XSS patterns
        for (const pattern of DANGEROUS_PATTERNS) {
            if (pattern.test(value)) {
                return value.replace(/<[^>]*>/g, ''); // Strip HTML tags
            }
        }
        // Trim whitespace
        return value.trim();
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }
    if (value && typeof value === 'object') {
        const cleaned: any = {};
        for (const [k, v] of Object.entries(value)) {
            cleaned[k] = sanitizeValue(v);
        }
        return cleaned;
    }
    return value;
}

export const inputSanitizer = (req: Request, _res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeValue(req.body);
    }
    if (req.query && typeof req.query === 'object') {
        for (const [key, val] of Object.entries(req.query)) {
            if (typeof val === 'string') {
                (req.query as any)[key] = val.trim();
            }
        }
    }
    next();
};

// =============================================================================
// Disable Stack Traces in Production
// =============================================================================

export const hideErrorDetails = (err: any, _req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'production' && err) {
        // Never expose stack traces in production
        const safeError = {
            code: err.code || 'INTERNAL_ERROR',
            message: err.expose ? err.message : 'An internal error occurred',
            requestId: (res as any).requestId || undefined,
        };
        const status = err.status || err.statusCode || 500;
        return res.status(status).json(safeError);
    }
    next(err);
};
