import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function requestLogger(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const startTime = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - startTime;

        logger.info("HTTP request completed", {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: duration,
        });
    });

    next();
}