
import type { Request, Response } from "express";

import {
    createCurrencyService,
    getCurrenciesService,
    getCurrencyByIdService,
    getCurrencyByCodeService,
    updateCurrencyExchangeRateService,
    setBaseCurrencyService,
    deactivateCurrencyService,
    activateCurrencyService,
} from "../../services/finance/currencyService.js";

const getTenantId = (req: Request): string | undefined => {
    return req.tenantId;
};

const getParam = (req: Request, paramName: string): string => {
    const value = req.params[paramName];

    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
};

const getErrorStatus = (message: string): number => {
    if (
        message.startsWith("Invalid ") ||
        message.includes("must ") ||
        message.includes("required") ||
        message.includes("greater than zero") ||
        message.includes("exactly 3 letters")
    ) {
        return 400;
    }

    if (message.includes("not found")) {
        return 404;
    }

    if (
        message.includes("already exists") ||
        message.includes("cannot be deactivated")
    ) {
        return 409;
    }

    return 500;
};

const sendError = (res: Response, error: unknown) => {
    const message =
        error instanceof Error ? error.message : "Internal server error";

    return res.status(getErrorStatus(message)).json({
        success: false,
        message,
    });
};

// Create currency
export const createCurrencyController = async (
    req: Request,
    res: Response
) => {
    try {
        const tenantId = getTenantId(req);

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "Tenant context is missing",
            });
        }

        const { code, name, symbol, exchangeRate, isBaseCurrency } = req.body;

        if (!code || !name || !symbol) {
            return res.status(400).json({
                success: false,
                message: "Currency code, name and symbol are required",
            });
        }

        const currency = await createCurrencyService({
            tenantId,
            code,
            name,
            symbol,
            exchangeRate,
            isBaseCurrency,
        });

        return res.status(201).json({
            success: true,
            message: "Currency created successfully",
            data: currency,
        });
    } catch (error) {
        return sendError(res, error);
    }
};

// Get all currencies
export const getCurrenciesController = async (
    req: Request,
    res: Response
) => {
    try {
        const tenantId = getTenantId(req);

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "Tenant context is missing",
            });
        }

        const activeOnly = req.query.activeOnly === "true";

        const currencies = await getCurrenciesService(
            tenantId,
            activeOnly
        );

        return res.status(200).json({
            success: true,
            count: currencies.length,
            data: currencies,
        });
    } catch (error) {
        return sendError(res, error);
    }
};

// Get currency by ID
export const getCurrencyByIdController = async (
    req: Request,
    res: Response
) => {
    try {
        const tenantId = getTenantId(req);

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "Tenant context is missing",
            });
        }

        const currency = await getCurrencyByIdService(
            getParam(req, "currencyId"),
            tenantId
        );

        return res.status(200).json({
            success: true,
            data: currency,
        });
    } catch (error) {
        return sendError(res, error);
    }
};

// Get currency by code
export const getCurrencyByCodeController = async (
    req: Request,
    res: Response
) => {
    try {
        const tenantId = getTenantId(req);

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "Tenant context is missing",
            });
        }

        const currency = await getCurrencyByCodeService(
            getParam(req, "code"),
            tenantId
        );

        return res.status(200).json({
            success: true,
            data: currency,
        });
    } catch (error) {
        return sendError(res, error);
    }
};

// Update exchange rate
export const updateCurrencyExchangeRateController = async (
    req: Request,
    res: Response
) => {
    try {
        const tenantId = getTenantId(req);

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "Tenant context is missing",
            });
        }

        const { exchangeRate } = req.body;

        if (exchangeRate === undefined || exchangeRate === null) {
            return res.status(400).json({
                success: false,
                message: "Exchange rate is required",
            });
        }

        const currency = await updateCurrencyExchangeRateService(
            getParam(req, "currencyId"),
            tenantId,
            String(exchangeRate)
        );

        return res.status(200).json({
            success: true,
            message: "Currency exchange rate updated successfully",
            data: currency,
        });
    } catch (error) {
        return sendError(res, error);
    }
};

// Set base currency
export const setBaseCurrencyController = async (
    req: Request,
    res: Response
) => {
    try {
        const tenantId = getTenantId(req);

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "Tenant context is missing",
            });
        }

        const currency = await setBaseCurrencyService(
            getParam(req, "currencyId"),
            tenantId
        );

        return res.status(200).json({
            success: true,
            message: "Base currency updated successfully",
            data: currency,
        });
    } catch (error) {
        return sendError(res, error);
    }
};

// Deactivate currency
export const deactivateCurrencyController = async (
    req: Request,
    res: Response
) => {
    try {
        const tenantId = getTenantId(req);

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "Tenant context is missing",
            });
        }

        const currency = await deactivateCurrencyService(
            getParam(req, "currencyId"),
            tenantId
        );

        return res.status(200).json({
            success: true,
            message: "Currency deactivated successfully",
            data: currency,
        });
    } catch (error) {
        return sendError(res, error);
    }
};

// Activate currency
export const activateCurrencyController = async (
    req: Request,
    res: Response
) => {
    try {
        const tenantId = getTenantId(req);

        if (!tenantId) {
            return res.status(400).json({
                success: false,
                message: "Tenant context is missing",
            });
        }

        const currency = await activateCurrencyService(
            getParam(req, "currencyId"),
            tenantId
        );

        return res.status(200).json({
            success: true,
            message: "Currency activated successfully",
            data: currency,
        });
    } catch (error) {
        return sendError(res, error);
    }
};
