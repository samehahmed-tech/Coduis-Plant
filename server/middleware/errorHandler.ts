import { Request, Response, NextFunction } from 'express';

interface AppErrorLike extends Error {
    statusCode?: number;
    code?: string;
    isOperational?: boolean;
}

/**
 * Global error handler middleware.
 * Sanitizes error responses in production to prevent stack trace leaks.
 */
export const errorHandler = (
    err: AppErrorLike,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    // Log error for debugging (always log full error server-side)
    console.error(`[ERROR] ${err.code || 'INTERNAL_ERROR'}:`, {
        message: err.message,
        stack: err.stack,
        statusCode,
    });

    // Operational errors are expected errors (validation, not found, etc.)
    if (err.isOperational) {
        return res.status(statusCode).json({
            error: err.code || 'ERROR',
            message: err.message,
        });
    }

    // For unexpected errors, hide details in production
    if (isProduction) {
        return res.status(500).json({
            error: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred. Please try again later.',
        });
    }

    // In development, show full error details
    return res.status(statusCode).json({
        error: err.code || 'INTERNAL_ERROR',
        message: err.message,
        stack: err.stack,
    });
};

/**
 * Custom error class for operational errors.
 */
export class AppError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;

    constructor(message: string, statusCode = 400, code = 'ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Async wrapper to catch errors in async route handlers.
 */
export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Not found handler for undefined routes.
 */
export const notFoundHandler = (_req: Request, res: Response) => {
    res.status(404).json({
        error: 'NOT_FOUND',
        message: 'The requested resource was not found.',
    });
};
