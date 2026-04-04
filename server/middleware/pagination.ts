/**
 * Pagination Middleware & Utilities
 * Provides standardized pagination for all list endpoints.
 *
 * Usage in controller:
 *   import { parsePagination, paginatedResponse } from '../middleware/pagination';
 *   const { page, limit, offset } = parsePagination(req);
 *   const [items, total] = await Promise.all([
 *     db.select().from(table).limit(limit).offset(offset),
 *     db.select({ count: sql`count(*)` }).from(table),
 *   ]);
 *   res.json(paginatedResponse(items, total, page, limit));
 */

import { Request } from 'express';

export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;
const MIN_LIMIT = 1;

/**
 * Parse pagination parameters from request query.
 * Supports: ?page=1&limit=50 or ?offset=0&limit=50
 */
export function parsePagination(req: Request, defaultLimit = DEFAULT_LIMIT): PaginationParams {
    const rawPage = Number(req.query.page);
    const rawLimit = Number(req.query.limit || req.query.per_page || req.query.pageSize);
    const rawOffset = Number(req.query.offset);

    const limit = Number.isFinite(rawLimit) && rawLimit >= MIN_LIMIT
        ? Math.min(rawLimit, MAX_LIMIT)
        : defaultLimit;

    let page: number;
    let offset: number;

    if (Number.isFinite(rawOffset) && rawOffset >= 0) {
        offset = Math.floor(rawOffset);
        page = Math.floor(offset / limit) + 1;
    } else {
        page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
        offset = (page - 1) * limit;
    }

    return { page, limit, offset };
}

/**
 * Build a standardized paginated response object.
 */
export function paginatedResponse<T>(
    data: T[],
    total: number | { count?: number | string }[],
    page: number,
    limit: number
): PaginatedResponse<T> {
    const totalCount = typeof total === 'number'
        ? total
        : Number((total as any)?.[0]?.count || 0);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
        data,
        pagination: {
            page,
            limit,
            total: totalCount,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
}

/**
 * Quick helper: apply LIMIT and OFFSET to a Drizzle query builder.
 * Note: Drizzle uses .limit() and .offset() methods on select queries.
 */
export function paginationSQL(params: PaginationParams) {
    return { limit: params.limit, offset: params.offset };
}
