/**
 * SSL/TLS Enforcement Middleware
 * Forces HTTPS in production environments.
 * 
 * Features:
 * - HTTP → HTTPS redirect in production
 * - HSTS (HTTP Strict Transport Security) header
 * - Configurable via environment variables
 * 
 * Environment Variables:
 *   FORCE_HTTPS=true        — Enable HTTPS redirect (default: true in production)
 *   HSTS_MAX_AGE=31536000   — HSTS max-age in seconds (default: 1 year)
 *   HSTS_PRELOAD=false      — Include HSTS preload directive
 */

import { Request, Response, NextFunction } from 'express';

const isProduction = process.env.NODE_ENV === 'production';
const FORCE_HTTPS = process.env.FORCE_HTTPS !== 'false' && isProduction;
const HSTS_MAX_AGE = Number(process.env.HSTS_MAX_AGE || 31536000); // 1 year
const HSTS_INCLUDE_SUBDOMAINS = process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false';
const HSTS_PRELOAD = process.env.HSTS_PRELOAD === 'true';

/**
 * Middleware: Redirect HTTP → HTTPS in production.
 * Respects X-Forwarded-Proto header (for reverse proxies like Nginx, Cloudflare, etc.)
 */
export const enforceHttps = (req: Request, res: Response, next: NextFunction) => {
    if (!FORCE_HTTPS) return next();

    // Check the protocol — respect X-Forwarded-Proto for proxied deployments
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const isSecure = proto === 'https';

    if (!isSecure) {
        // 301 Permanent Redirect to HTTPS
        const httpsUrl = `https://${req.hostname}${req.originalUrl}`;
        return res.redirect(301, httpsUrl);
    }

    next();
};

/**
 * Middleware: Set HSTS (HTTP Strict Transport Security) header.
 * Instructs browsers to only use HTTPS for future requests.
 */
export const hstsHeader = (req: Request, res: Response, next: NextFunction) => {
    if (!isProduction) return next();

    let hstsValue = `max-age=${HSTS_MAX_AGE}`;
    if (HSTS_INCLUDE_SUBDOMAINS) hstsValue += '; includeSubDomains';
    if (HSTS_PRELOAD) hstsValue += '; preload';

    res.setHeader('Strict-Transport-Security', hstsValue);
    next();
};

/**
 * Combined middleware: enforceHttps + hstsHeader
 */
export const sslEnforcement = [enforceHttps, hstsHeader];
