import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { errorResponse } from "../utils/response";
import { logger } from "../utils/logger";

export function notFoundHandler(
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    errorResponse(
        res,
        404,
        `Route not found: ${req.method} ${req.originalUrl}`,
        "ROUTE_NOT_FOUND"
    );
}

export function errorHandler(
    error: unknown,
    _req: Request,
    res: Response,
    next: NextFunction
): void {
    if (res.headersSent) {
        next(error);
        return;
    }

    if (error instanceof AppError) {
        logger.warn(error.message, {
            statusCode: error.statusCode,
            errorCode: error.errorCode,
        });

        errorResponse(
            res,
            error.statusCode,
            error.message,
            error.errorCode
        );

        return;
    }

    logger.error("Unhandled application error", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
    });

    errorResponse(
        res,
        500,
        "An unexpected server error occurred.",
        "INTERNAL_SERVER_ERROR"
    );
}