
import { Request, Response } from "express";
import {
    getTenantSettings,
    updateTenantSettings,
    resetTenantSettings,
} from "../../services/settings/settingsService";

const getRequestContext = (req: Request) => {
    const tenantId = req.tenantId?.toString();

    if (!tenantId) {
        throw new Error("Tenant context is required");
    }

    return tenantId;
};

const handleError = (res: Response, error: unknown) => {
    const message =
        error instanceof Error ? error.message : "Internal server error";

    const status = message.includes("not found")
        ? 404
        : message.includes("required") || message.includes("Invalid")
            ? 400
            : 400;

    return res.status(status).json({
        success: false,
        message,
    });
};

export const getSettings = async (req: Request, res: Response) => {
    try {
        const tenantId = getRequestContext(req);
        const settings = await getTenantSettings(tenantId);

        return res.status(200).json({
            success: true,
            data: settings,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const tenantId = getRequestContext(req);
        const settings = await updateTenantSettings(tenantId, req.body);

        return res.status(200).json({
            success: true,
            message: "Settings updated successfully",
            data: settings,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const resetSettings = async (req: Request, res: Response) => {
    try {
        const tenantId = getRequestContext(req);
        const settings = await resetTenantSettings(tenantId);

        return res.status(200).json({
            success: true,
            message: "Settings reset successfully",
            data: settings,
        });
    } catch (error) {
        return handleError(res, error);
    }
};
