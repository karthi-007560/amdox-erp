import type { Request, Response, NextFunction } from "express";

import {
    createInventoryService,
    getInventoryByTenantService,
    getInventoryByIdService,
    updateInventoryService,
    deleteInventoryService,
} from "../../services/supplyChain/inventoryService.js";

import {
    getReorderSuggestionsService,
} from "../../services/supplyChain/reorderService.js";

function getErrorStatus(error: unknown): number {
    const message = error instanceof Error ? error.message : "";

    if (message.startsWith("INVALID_")) {
        return 400;
    }

    switch (message) {
        case "ITEM_CODE_NAME_AND_UNIT_REQUIRED":
        case "ITEM_CODE_REQUIRED":
        case "ITEM_NAME_REQUIRED":
        case "UNIT_REQUIRED":
        case "RESERVED_QUANTITY_EXCEEDS_STOCK":
        case "NO_INVENTORY_FIELDS_TO_UPDATE":
            return 400;

        case "TENANT_NOT_FOUND":
        case "INVENTORY_ITEM_NOT_FOUND":
            return 404;

        case "TENANT_NOT_ACTIVE":
            return 403;

        case "ITEM_CODE_ALREADY_EXISTS":
            return 409;

        case "INVENTORY_UPDATE_FAILED":
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

function getInventoryId(req: Request): string | undefined {
    const inventoryId = req.params.inventoryId;

    return typeof inventoryId === "string" && inventoryId.trim()
        ? inventoryId.trim()
        : undefined;
}

export async function createInventoryController(
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
            itemCode,
            name,
            description,
            category,
            unit,
            quantity,
            reservedQuantity,
            reorderLevel,
            unitCost,
            warehouse,
            status,
        } = req.body;

        if (
            typeof itemCode !== "string" ||
            typeof name !== "string" ||
            typeof unit !== "string"
        ) {
            res.status(400).json({
                success: false,
                message: "ITEM_CODE_NAME_AND_UNIT_REQUIRED",
            });
            return;
        }

        const item = await createInventoryService({
            tenantId,
            itemCode,
            name,
            description,
            category,
            unit,
            quantity,
            reservedQuantity,
            reorderLevel,
            unitCost,
            warehouse,
            status,
        });

        res.status(201).json({
            success: true,
            message: "Inventory item created successfully",
            data: item,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getInventoryController(
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

        const items = await getInventoryByTenantService(tenantId);

        res.status(200).json({
            success: true,
            count: items.length,
            data: items,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getInventoryItemController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const inventoryId = getInventoryId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!inventoryId) {
            res.status(400).json({
                success: false,
                message: "INVENTORY_ID_REQUIRED",
            });
            return;
        }

        const item = await getInventoryByIdService(
            inventoryId,
            tenantId
        );

        res.status(200).json({
            success: true,
            data: item,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function updateInventoryController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const inventoryId = getInventoryId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!inventoryId) {
            res.status(400).json({
                success: false,
                message: "INVENTORY_ID_REQUIRED",
            });
            return;
        }

        const {
            itemCode,
            name,
            description,
            category,
            unit,
            quantity,
            reservedQuantity,
            reorderLevel,
            unitCost,
            warehouse,
            status,
        } = req.body;

        const item = await updateInventoryService(
            inventoryId,
            tenantId,
            {
                itemCode,
                name,
                description,
                category,
                unit,
                quantity,
                reservedQuantity,
                reorderLevel,
                unitCost,
                warehouse,
                status,
            }
        );

        res.status(200).json({
            success: true,
            message: "Inventory item updated successfully",
            data: item,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function deleteInventoryController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const inventoryId = getInventoryId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!inventoryId) {
            res.status(400).json({
                success: false,
                message: "INVENTORY_ID_REQUIRED",
            });
            return;
        }

        await deleteInventoryService(inventoryId, tenantId);

        res.status(200).json({
            success: true,
            message: "Inventory item deleted successfully",
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getReorderSuggestionsController(
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

        const suggestions =
            await getReorderSuggestionsService(tenantId);

        res.status(200).json({
            success: true,
            message: "Reorder suggestions fetched successfully",
            ...suggestions,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}
