
import type {
    Request,
    Response,
    NextFunction,
} from "express";

import {
    createForecastService,
    getForecastsByTenantService,
    getForecastByIdService,
    deleteForecastService,
} from "../../services/supplyChain/forecastingService.js";

function getErrorStatus(errorMessage: string): number {
    if (
        errorMessage.startsWith("INVALID_") ||
        errorMessage === "HISTORICAL_DEMAND_REQUIRED" ||
        errorMessage === "FORECAST_PERIODS_REQUIRED"
    ) {
        return 400;
    }

    if (
        errorMessage === "TENANT_NOT_FOUND" ||
        errorMessage === "INVENTORY_ITEM_NOT_FOUND" ||
        errorMessage === "FORECAST_NOT_FOUND"
    ) {
        return 404;
    }

    if (
        errorMessage === "TENANT_NOT_ACTIVE" ||
        errorMessage === "INVENTORY_ITEM_NOT_ACTIVE"
    ) {
        return 403;
    }

    if (
        errorMessage === "FORECAST_PERIOD_MUST_BE_FUTURE"
    ) {
        return 400;
    }

    return 500;
}

function handleControllerError(
    error: unknown,
    res: Response,
    next: NextFunction
): void {
    const message =
        error instanceof Error
            ? error.message
            : "INTERNAL_SERVER_ERROR";

    const status = getErrorStatus(message);

    if (status === 500) {
        next(error);
        return;
    }

    res.status(status).json({
        success: false,
        message,
    });
}

function getTenantId(req: Request): string | undefined {
    return req.tenantId;
}

function getForecastId(req: Request): string | undefined {
    const forecastId = req.params.forecastId;

    return typeof forecastId === "string"
        ? forecastId
        : undefined;
}

export async function createForecastController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        const forecast = await createForecastService({
            tenantId,
            inventoryId: req.body.inventoryId,
            historicalDemand: req.body.historicalDemand,
            forecastPeriods: req.body.forecastPeriods,
            windowSize: req.body.windowSize,
            generatedBy: req.auth?.userId,
        });

        res.status(201).json({
            success: true,
            message: "Forecast created successfully",
            data: forecast,
        });
    } catch (error) {
        handleControllerError(error, res, next);
    }
}

export async function getForecastsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        const forecasts = await getForecastsByTenantService(
            tenantId
        );

        res.status(200).json({
            success: true,
            count: forecasts.length,
            data: forecasts,
        });
    } catch (error) {
        handleControllerError(error, res, next);
    }
}

export async function getForecastController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const forecastId = getForecastId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!forecastId) {
            res.status(400).json({
                success: false,
                message: "INVALID_FORECAST_ID",
            });
            return;
        }

        const forecast = await getForecastByIdService(
            forecastId,
            tenantId
        );

        res.status(200).json({
            success: true,
            data: forecast,
        });
    } catch (error) {
        handleControllerError(error, res, next);
    }
}

export async function deleteForecastController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const forecastId = getForecastId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!forecastId) {
            res.status(400).json({
                success: false,
                message: "INVALID_FORECAST_ID",
            });
            return;
        }

        await deleteForecastService(
            forecastId,
            tenantId
        );

        res.status(200).json({
            success: true,
            message: "Forecast deleted successfully",
        });
    } catch (error) {
        handleControllerError(error, res, next);
    }
}
