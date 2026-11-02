import mongoose from "mongoose";

import type {
    IForecastDemand,
} from "../../models/supplyChain/Forecast.js";

import {
    createForecast,
    getForecastsByTenant,
    getForecastByIdAndTenant,
    deleteForecastByIdAndTenant,
} from "../../repositories/supplyChain/forecastRepository.js";

import {
    findTenantById,
} from "../../repositories/tenantRepository.js";

import {
    getInventoryByIdAndTenant,
} from "../../repositories/supplyChain/inventoryRepository.js";

interface DemandPeriodInput {
    periodStart: Date | string;
    periodEnd: Date | string;
    quantity: number;
}

interface ForecastPeriodInput {
    periodStart: Date | string;
    periodEnd: Date | string;
}

interface CreateForecastInput {
    tenantId: string;
    inventoryId: string;
    historicalDemand: DemandPeriodInput[];
    forecastPeriods: ForecastPeriodInput[];
    windowSize: number;
    generatedBy?: string;
}

function validateObjectId(
    id: string,
    errorMessage: string
): void {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(errorMessage);
    }
}

async function validateActiveTenant(
    tenantId: string
): Promise<void> {
    const tenant = await findTenantById(tenantId);

    if (!tenant) {
        throw new Error("TENANT_NOT_FOUND");
    }

    if (tenant.status !== "active") {
        throw new Error("TENANT_NOT_ACTIVE");
    }
}

function parseDate(
    value: Date | string
): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new Error("INVALID_FORECAST_DATE");
    }

    return date;
}

function validateDemandPeriods(
    periods: DemandPeriodInput[]
): IForecastDemand[] {
    if (!Array.isArray(periods) || periods.length === 0) {
        throw new Error("HISTORICAL_DEMAND_REQUIRED");
    }

    const validatedPeriods: IForecastDemand[] = periods.map(
        (period) => {
            if (
                !period ||
                typeof period.quantity !== "number" ||
                !Number.isFinite(period.quantity) ||
                period.quantity < 0
            ) {
                throw new Error("INVALID_HISTORICAL_DEMAND");
            }

            const periodStart = parseDate(period.periodStart);
            const periodEnd = parseDate(period.periodEnd);

            if (periodStart > periodEnd) {
                throw new Error("INVALID_HISTORICAL_PERIOD_RANGE");
            }

            return {
                periodStart,
                periodEnd,
                quantity: period.quantity,
            };
        }
    );

    for (let i = 1; i < validatedPeriods.length; i++) {
        if (
            validatedPeriods[i].periodStart <=
            validatedPeriods[i - 1].periodEnd
        ) {
            throw new Error("INVALID_HISTORICAL_PERIOD_ORDER");
        }
    }

    return validatedPeriods;
}

function validateForecastPeriods(
    periods: ForecastPeriodInput[],
    lastHistoricalDate: Date
): IForecastDemand[] {
    if (!Array.isArray(periods) || periods.length === 0) {
        throw new Error("FORECAST_PERIODS_REQUIRED");
    }

    const validatedPeriods: IForecastDemand[] = periods.map(
        (period) => {
            const periodStart = parseDate(period.periodStart);
            const periodEnd = parseDate(period.periodEnd);

            if (periodStart > periodEnd) {
                throw new Error("INVALID_FORECAST_PERIOD_RANGE");
            }

            if (periodStart <= lastHistoricalDate) {
                throw new Error("FORECAST_PERIOD_MUST_BE_FUTURE");
            }

            return {
                periodStart,
                periodEnd,
                quantity: 0,
            };
        }
    );

    for (let i = 1; i < validatedPeriods.length; i++) {
        if (
            validatedPeriods[i].periodStart <=
            validatedPeriods[i - 1].periodEnd
        ) {
            throw new Error("INVALID_FORECAST_PERIOD_ORDER");
        }
    }

    return validatedPeriods;
}

export async function createForecastService(
    input: CreateForecastInput
) {
    const {
        tenantId,
        inventoryId,
        historicalDemand,
        forecastPeriods,
        windowSize,
        generatedBy,
    } = input;

    validateObjectId(tenantId, "INVALID_TENANT_ID");
    validateObjectId(inventoryId, "INVALID_INVENTORY_ID");

    if (generatedBy) {
        validateObjectId(generatedBy, "INVALID_USER_ID");
    }

    await validateActiveTenant(tenantId);

    const inventory = await getInventoryByIdAndTenant(
        inventoryId,
        tenantId
    );

    if (!inventory) {
        throw new Error("INVENTORY_ITEM_NOT_FOUND");
    }

    if (inventory.status !== "active") {
        throw new Error("INVENTORY_ITEM_NOT_ACTIVE");
    }

    const validatedHistory = validateDemandPeriods(
        historicalDemand
    );

    if (
        !Number.isInteger(windowSize) ||
        windowSize < 1 ||
        windowSize > validatedHistory.length
    ) {
        throw new Error("INVALID_FORECAST_WINDOW_SIZE");
    }

    const lastHistoricalDate =
        validatedHistory[validatedHistory.length - 1].periodEnd;

    const validatedForecastPeriods = validateForecastPeriods(
        forecastPeriods,
        lastHistoricalDate
    );

    // Simple Moving Average:
    // Average the most recent `windowSize` historical observations.
    const recentDemand = validatedHistory.slice(-windowSize);

    const totalDemand = recentDemand.reduce(
        (sum, period) => sum + period.quantity,
        0
    );

    const predictedDemand = totalDemand / windowSize;

    const forecastedDemand = validatedForecastPeriods.map(
        (period) => ({
            ...period,
            quantity: Number(predictedDemand.toFixed(2)),
        })
    );

    return createForecast({
        tenantId: new mongoose.Types.ObjectId(tenantId),
        inventoryId: new mongoose.Types.ObjectId(inventoryId),
        historicalDemand: validatedHistory,
        forecastedDemand,
        method: "simple_moving_average",
        windowSize,
        generatedBy: generatedBy
            ? new mongoose.Types.ObjectId(generatedBy)
            : undefined,
    });
}

export async function getForecastsByTenantService(
    tenantId: string
) {
    validateObjectId(tenantId, "INVALID_TENANT_ID");
    await validateActiveTenant(tenantId);

    return getForecastsByTenant(tenantId);
}

export async function getForecastByIdService(
    forecastId: string,
    tenantId: string
) {
    validateObjectId(forecastId, "INVALID_FORECAST_ID");
    validateObjectId(tenantId, "INVALID_TENANT_ID");

    await validateActiveTenant(tenantId);

    const forecast = await getForecastByIdAndTenant(
        forecastId,
        tenantId
    );

    if (!forecast) {
        throw new Error("FORECAST_NOT_FOUND");
    }

    return forecast;
}

export async function deleteForecastService(
    forecastId: string,
    tenantId: string
) {
    validateObjectId(forecastId, "INVALID_FORECAST_ID");
    validateObjectId(tenantId, "INVALID_TENANT_ID");

    await validateActiveTenant(tenantId);

    const deletedForecast = await deleteForecastByIdAndTenant(
        forecastId,
        tenantId
    );

    if (!deletedForecast) {
        throw new Error("FORECAST_NOT_FOUND");
    }

    return deletedForecast;
}