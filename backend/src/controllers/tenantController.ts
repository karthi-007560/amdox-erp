
import mongoose from "mongoose";
import type { Request, Response, NextFunction } from "express";
import {
    createTenantService,
    getTenantByIdService,
    getAllTenantsService,
    assignUserToTenantService,
    updateTenantService,
} from "../services/tenantService";

export async function createTenantController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { name, code } = req.body;

        const tenant = await createTenantService({
            name,
            code,
            createdBy: req.auth?.userId,
        });

        res.status(201).json({
            success: true,
            message: "Tenant created successfully.",
            data: tenant,
        });
    } catch (error: unknown) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000
        ) {
            res.status(409).json({
                success: false,
                message: "A tenant with this code already exists.",
            });
            return;
        }

        if (error instanceof Error) {
            if (error.message === "TENANT_CODE_ALREADY_EXISTS") {
                res.status(409).json({
                    success: false,
                    message: "A tenant with this code already exists.",
                });
                return;
            }

            if (error.message === "TENANT_NAME_AND_CODE_REQUIRED") {
                res.status(400).json({
                    success: false,
                    message: "Tenant name and code are required.",
                });
                return;
            }
        }

        next(error);
    }
}

export async function getTenantController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = req.params.tenantId;

        if (
            typeof tenantId !== "string" ||
            !mongoose.isValidObjectId(tenantId)
        ) {
            res.status(400).json({
                success: false,
                message: "Invalid tenant ID.",
            });
            return;
        }

        const tenant = await getTenantByIdService(tenantId);

        res.status(200).json({
            success: true,
            data: tenant,
        });
    } catch (error: unknown) {
        if (
            error instanceof Error &&
            error.message === "TENANT_NOT_FOUND"
        ) {
            res.status(404).json({
                success: false,
                message: "Tenant not found.",
            });
            return;
        }

        next(error);
    }
}

export async function getAllTenantsController(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenants = await getAllTenantsService();

        res.status(200).json({
            success: true,
            count: tenants.length,
            data: tenants,
        });
    } catch (error: unknown) {
        next(error);
    }
}

export async function assignUserToTenantController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { userId, tenantId } = req.body;

        if (
            typeof userId !== "string" ||
            typeof tenantId !== "string" ||
            !userId.trim() ||
            !tenantId.trim()
        ) {
            res.status(400).json({
                success: false,
                message: "User ID and tenant ID are required.",
            });
            return;
        }

        const user = await assignUserToTenantService(
            userId,
            tenantId
        );

        res.status(200).json({
            success: true,
            message: "User assigned to tenant successfully.",
            data: user,
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            const errors: Record<
                string,
                { status: number; message: string }
            > = {
                INVALID_USER_OR_TENANT_ID: {
                    status: 400,
                    message: "Invalid user ID or tenant ID.",
                },
                TENANT_NOT_FOUND: {
                    status: 404,
                    message: "Tenant not found.",
                },
                TENANT_NOT_ACTIVE: {
                    status: 409,
                    message:
                        "Users can only be assigned to active tenants.",
                },
                USER_NOT_FOUND: {
                    status: 404,
                    message: "User not found.",
                },
                USER_ALREADY_ASSIGNED_TO_TENANT: {
                    status: 409,
                    message: "User is already assigned to a tenant.",
                },
                USER_ASSIGNMENT_FAILED: {
                    status: 500,
                    message:
                        "Unable to assign user to tenant. Please try again.",
                },
            };

            const knownError = errors[error.message];

            if (knownError) {
                res.status(knownError.status).json({
                    success: false,
                    message: knownError.message,
                });
                return;
            }
        }

        next(error);
    }
}

export async function updateTenantController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = req.params.tenantId;

        if (typeof tenantId !== "string") {
            res.status(400).json({
                success: false,
                message: "Invalid tenant ID.",
            });
            return;
        }

        const { name, code, status, settings } = req.body;

        const tenant = await updateTenantService(tenantId, {
            name,
            code,
            status,
            settings,
        });

        res.status(200).json({
            success: true,
            message: "Organisation updated successfully.",
            data: tenant,
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            const errors: Record<
                string,
                { status: number; message: string }
            > = {
                INVALID_TENANT_ID: {
                    status: 400,
                    message: "Invalid organisation ID.",
                },
                TENANT_NOT_FOUND: {
                    status: 404,
                    message: "Organisation not found.",
                },
                INVALID_TENANT_NAME: {
                    status: 400,
                    message: "Organisation name cannot be empty.",
                },
                INVALID_TENANT_CODE: {
                    status: 400,
                    message: "Organisation code cannot be empty.",
                },
                TENANT_CODE_ALREADY_EXISTS: {
                    status: 409,
                    message: "An organisation with this code already exists.",
                },
                INVALID_TENANT_STATUS: {
                    status: 400,
                    message: "Invalid organisation status.",
                },
                INVALID_TENANT_SETTINGS: {
                    status: 400,
                    message: "Invalid organisation settings.",
                },
                NO_TENANT_UPDATES_PROVIDED: {
                    status: 400,
                    message: "Provide at least one field to update.",
                },
                TENANT_UPDATE_FAILED: {
                    status: 500,
                    message: "Unable to update organisation.",
                },
            };

            const knownError = errors[error.message];

            if (knownError) {
                res.status(knownError.status).json({
                    success: false,
                    message: knownError.message,
                });
                return;
            }

            if (
                typeof error === "object" &&
                "code" in error &&
                error.code === 11000
            ) {
                res.status(409).json({
                    success: false,
                    message: "An organisation with this code already exists.",
                });
                return;
            }
        }

        next(error);
    }
}
