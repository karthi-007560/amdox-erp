
import { Request, Response } from "express";
import {
    createPermission,
    listPermissions,
    getPermissionById,
    updatePermission,
    deletePermission,
} from "../../services/settings/permissionService";

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

export const createPermissionController = async (
    req: Request,
    res: Response
) => {
    try {
        const tenantId = getTenantContext(req);
        const permission = await createPermission(tenantId, req.body);

        return res.status(201).json({
            success: true,
            message: "Permission created successfully",
            data: permission,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const getPermissions = async (req: Request, res: Response) => {
    try {
        const tenantId = getTenantContext(req);

        const result = await listPermissions(tenantId, {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 10,
            module: req.query.module as string | undefined,
            isActive:
                req.query.isActive === undefined
                    ? undefined
                    : req.query.isActive === "true",
        });

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const getPermissionByIdController = async (
    req: Request,
    res: Response
) => {
    try {
        const tenantId = getTenantContext(req);

        const permission = await getPermissionById(
            tenantId,
            req.params.permissionId as string
        );

        return res.status(200).json({
            success: true,
            data: permission,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const updatePermissionController = async (
    req: Request,
    res: Response
) => {
    try {
        const tenantId = getTenantContext(req);

        const permission = await updatePermission(
            tenantId,
            req.params.permissionId as string,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Permission updated successfully",
            data: permission,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const deletePermissionController = async (
    req: Request,
    res: Response
) => {
    try {
        const tenantId = getTenantContext(req);

        const result = await deletePermission(
            tenantId,
            req.params.permissionId as string
        );

        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        return handleError(res, error);
    }
};
