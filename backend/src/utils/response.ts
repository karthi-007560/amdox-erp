import type { Response } from "express";

export function successResponse<T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T
): Response {
    return res.status(statusCode).json({
        success: true,
        message,
        ...(data !== undefined ? { data } : {}),
    });
}

export function errorResponse(
    res: Response,
    statusCode: number,
    message: string,
    errorCode?: string
): Response {
    return res.status(statusCode).json({
        success: false,
        message,
        ...(errorCode ? { errorCode } : {}),
    });
}