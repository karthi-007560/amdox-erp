
import type { Request, Response, NextFunction } from "express";

import {
    createVendorService,
    getVendorsByTenantService,
    getVendorByIdService,
    updateVendorService,
    deleteVendorService,
} from "../../services/supplyChain/vendorService.js";

function getErrorStatus(error: unknown): number {
    const message = error instanceof Error ? error.message : "";

    if (message.startsWith("INVALID_")) {
        return 400;
    }

    switch (message) {
        case "VENDOR_CODE_AND_NAME_REQUIRED":
        case "VENDOR_CODE_REQUIRED":
        case "VENDOR_NAME_REQUIRED":
        case "INVALID_PAYMENT_TERMS":
        case "NO_VENDOR_FIELDS_TO_UPDATE":
            return 400;

        case "TENANT_NOT_FOUND":
        case "VENDOR_NOT_FOUND":
            return 404;

        case "TENANT_NOT_ACTIVE":
            return 403;

        case "VENDOR_CODE_ALREADY_EXISTS":
            return 409;

        case "VENDOR_UPDATE_FAILED":
            return 409;

        default:
            return 500;
    }
}

function sendError(
    error: unknown,
    res: Response,
    next: NextFunction
): void {
    const status = getErrorStatus(error);

    if (status === 500) {
        next(error);
        return;
    }

    res.status(status).json({
        success: false,
        message: error instanceof Error
            ? error.message
            : "Request failed",
    });
}

function getTenantId(req: Request): string | undefined {
    return req.tenantId;
}

function getVendorId(req: Request): string | undefined {
    const vendorId = req.params.vendorId;

    return typeof vendorId === "string" && vendorId.trim()
        ? vendorId.trim()
        : undefined;
}

export async function createVendorController(
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

        const {
            vendorCode,
            name,
            contactPerson,
            email,
            phone,
            website,
            address,
            taxId,
            paymentTermsDays,
            status,
            notes,
        } = req.body;

        if (
            typeof vendorCode !== "string" ||
            typeof name !== "string"
        ) {
            res.status(400).json({
                success: false,
                message: "VENDOR_CODE_AND_NAME_REQUIRED",
            });
            return;
        }

        const vendor = await createVendorService({
            tenantId,
            vendorCode,
            name,
            contactPerson,
            email,
            phone,
            website,
            address,
            taxId,
            paymentTermsDays,
            status,
            notes,
        });

        res.status(201).json({
            success: true,
            message: "Vendor created successfully",
            data: vendor,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getVendorsController(
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

        const vendors = await getVendorsByTenantService(tenantId);

        res.status(200).json({
            success: true,
            count: vendors.length,
            data: vendors,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getVendorController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const vendorId = getVendorId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!vendorId) {
            res.status(400).json({
                success: false,
                message: "VENDOR_ID_REQUIRED",
            });
            return;
        }

        const vendor = await getVendorByIdService(
            vendorId,
            tenantId
        );

        res.status(200).json({
            success: true,
            data: vendor,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function updateVendorController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const vendorId = getVendorId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!vendorId) {
            res.status(400).json({
                success: false,
                message: "VENDOR_ID_REQUIRED",
            });
            return;
        }

        const {
            vendorCode,
            name,
            contactPerson,
            email,
            phone,
            website,
            address,
            taxId,
            paymentTermsDays,
            status,
            notes,
        } = req.body;

        const vendor = await updateVendorService(
            vendorId,
            tenantId,
            {
                vendorCode,
                name,
                contactPerson,
                email,
                phone,
                website,
                address,
                taxId,
                paymentTermsDays,
                status,
                notes,
            }
        );

        res.status(200).json({
            success: true,
            message: "Vendor updated successfully",
            data: vendor,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function deleteVendorController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const vendorId = getVendorId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!vendorId) {
            res.status(400).json({
                success: false,
                message: "VENDOR_ID_REQUIRED",
            });
            return;
        }

        await deleteVendorService(vendorId, tenantId);

        res.status(200).json({
            success: true,
            message: "Vendor deleted successfully",
        });
    } catch (error) {
        sendError(error, res, next);
    }
}
