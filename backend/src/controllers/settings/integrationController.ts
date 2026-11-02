
import { Request, Response } from "express";
import {
    createIntegration,
    listIntegrations,
    getIntegrationByProvider,
    updateIntegration,
    deleteIntegration,
} from "../../services/settings/integrationService";

const getTenantContext = (req: Request) => {
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
        : message.includes("already exists")
            ? 409
            : 400;

    return res.status(status).json({
        success: false,
        message,
    });
};

export const createIntegrationController = async (
    req: Request,
    res: Response
) => {
    try {
        const tenantId = getTenantContext(req);

        const integration = await createIntegration(
            tenantId,
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Integration configuration created successfully",
            data: integration,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const getIntegrations = async (
    req: Request,
    res: Response
) => {
    try {
        const tenantId = getTenantContext(req);
        const integrations = await listIntegrations(tenantId);

        return res.status(200).json({
            success: true,
            data: integrations,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const getIntegrationByProviderController = async (
    req: Request,
    res: Response
) => {
    try {
        const tenantId = getTenantContext(req);

        const integration = await getIntegrationByProvider(
            tenantId,
            req.params.provider as string
        );

        return res.status(200).json({
            success: true,
            data: integration,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const updateIntegrationController = async (
    req: Request,
    res: Response
) => {
    try {
        const tenantId = getTenantContext(req);

        const integration = await updateIntegration(
            tenantId,
            req.params.provider as string,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Integration configuration updated successfully",
            data: integration,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const deleteIntegrationController = async (
    req: Request,
    res: Response
) => {
    try {
        const tenantId = getTenantContext(req);

        const result = await deleteIntegration(
            tenantId,
            req.params.provider as string
        );

        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        return handleError(res, error);
    }
};
