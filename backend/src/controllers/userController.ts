
import type { Request, Response } from "express";

import {
    getUsersService,
    getUserByIdService,
    updateUserService,
} from "../services/userService";

export async function getUsersController(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const tenantId = req.tenantId;

        if (!tenantId) {
            res.status(400).json({
                success: false,
                message: "Tenant context is required",
            });
            return;
        }

        const users = await getUsersService(tenantId);

        res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : "Failed to fetch users";

        res.status(400).json({
            success: false,
            message,
        });
    }
}

export async function getUserByIdController(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const tenantId = req.tenantId;

        if (!tenantId) {
            res.status(400).json({
                success: false,
                message: "Tenant context is required",
            });
            return;
        }

        const user = await getUserByIdService(
            String(req.params.userId),
            tenantId
        );

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : "Failed to fetch user";

        const statusCode =
            message === "USER_NOT_FOUND" ? 404 : 400;

        res.status(statusCode).json({
            success: false,
            message,
        });
    }
}

export async function updateUserController(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const tenantId = req.tenantId;
        const actor = req.auth;

        if (!tenantId || !actor) {
            res.status(400).json({
                success: false,
                message: "Authentication and tenant context are required",
            });
            return;
        }

        const user = await updateUserService(
            String(req.params.userId),
            tenantId,
            actor.userId,
            actor.role as "admin" | "manager" | "employee",
            req.body
        );

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user,
        });
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : "Failed to update user";

        const statusCode =
            message === "USER_NOT_FOUND" ? 404 : 400;

        res.status(statusCode).json({
            success: false,
            message,
        });
    }
}
