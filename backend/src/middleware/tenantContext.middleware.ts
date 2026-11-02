
import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import { User } from "../models/User";
import { Tenant } from "../models/Tenant";



export async function tenantContext(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.auth?.userId) {
            res.status(401).json({
                success: false,
                message: "Authentication is required.",
            });
            return;
        }

        if (!mongoose.isValidObjectId(req.auth.userId)) {
            res.status(401).json({
                success: false,
                message: "Invalid authenticated user.",
            });
            return;
        }

        const user = await User.findById(req.auth.userId).select(
            "_id role tenantId isActive"
        );

        if (!user || !user.isActive) {
            res.status(401).json({
                success: false,
                message: "User is not authorized to access this resource.",
            });
            return;
        }

        let tenantId: string;

        if (user.role === "admin") {
            // Global admins must explicitly select a tenant.
            const requestedTenantId =
                req.body?.tenantId ?? req.query?.tenantId;

            if (
                typeof requestedTenantId !== "string" ||
                !mongoose.isValidObjectId(requestedTenantId)
            ) {
                res.status(400).json({
                    success: false,
                    message: "A valid tenantId is required for admin access.",
                });
                return;
            }

            tenantId = requestedTenantId;
        } else {
            // Managers and employees use their assigned tenant.
            if (!user.tenantId) {
                res.status(403).json({
                    success: false,
                    message: "Your account is not assigned to a tenant.",
                });
                return;
            }

            tenantId = user.tenantId.toString();
        }

        const tenant = await Tenant.findById(tenantId).select(
            "_id status"
        );

        if (!tenant) {
            res.status(404).json({
                success: false,
                message: "TENANT_NOT_FOUND",
            });
            return;
        }

        if (tenant.status !== "active") {
            res.status(403).json({
                success: false,
                message: "TENANT_NOT_ACTIVE",
            });
            return;
        }

        req.tenantId = tenant._id.toString();

        next();
    } catch (error: unknown) {
        next(error);
    }
}
