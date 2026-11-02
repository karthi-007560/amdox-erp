
import { Request, Response } from "express";
import {
    createRole,
    listRoles,
    getRoleById,
    updateRole,
    deleteRole,
} from "../../services/settings/roleService";

const getRequestContext = (req: Request) => {
    const tenantId = req.tenantId?.toString();
    const userId = req.auth?.userId?.toString();

    if (!tenantId || !userId) {
        throw new Error("Authentication and tenant context are required");
    }

    return { tenantId, userId };
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

export const createRoleController = async (
    req: Request,
    res: Response
) => {
    try {
        const { tenantId, userId } = getRequestContext(req);

        const role = await createRole(tenantId, userId, req.body);

        return res.status(201).json({
            success: true,
            message: "Role created successfully",
            data: role,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const getRoles = async (req: Request, res: Response) => {
    try {
        const { tenantId } = getRequestContext(req);

        const result = await listRoles(tenantId, {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 10,
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

export const getRoleByIdController = async (
    req: Request,
    res: Response
) => {
    try {
        const { tenantId } = getRequestContext(req);

        const role = await getRoleById(
            tenantId,
            req.params.roleId as string
        );

        return res.status(200).json({
            success: true,
            data: role,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const updateRoleController = async (
    req: Request,
    res: Response
) => {
    try {
        const { tenantId } = getRequestContext(req);

        const role = await updateRole(
            tenantId,
            req.params.roleId as string,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Role updated successfully",
            data: role,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

export const deleteRoleController = async (
    req: Request,
    res: Response
) => {
    try {
        const { tenantId } = getRequestContext(req);

        const result = await deleteRole(
            tenantId,
            req.params.roleId as string
        );

        return res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        return handleError(res, error);
    }
};
