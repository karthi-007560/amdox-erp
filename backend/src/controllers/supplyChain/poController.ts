
import type { Request, Response, NextFunction } from "express";

import {
    matchPurchaseOrderInvoiceService,
} from "../../services/supplyChain/matchingService.js";

import {
    createPurchaseOrderService,
    getPurchaseOrdersByTenantService,
    getPurchaseOrderByIdService,
    updatePurchaseOrderService,
    approvePurchaseOrderService,
    deletePurchaseOrderService,
    createGoodsReceiptService,
} from "../../services/supplyChain/poService.js";

function getErrorStatus(error: unknown): number {
    const message = error instanceof Error ? error.message : "";

    if (message.startsWith("INVALID_")) {
        return 400;
    }

    switch (message) {
        case "PO_NUMBER_REQUIRED":
        case "PURCHASE_ORDER_ITEMS_REQUIRED":
        case "INVALID_ORDER_QUANTITY":
        case "INVALID_UNIT_COST":
        case "INVALID_TAX_AMOUNT":
        case "INVALID_EXPECTED_DELIVERY_DATE":
        case "NO_PURCHASE_ORDER_FIELDS_TO_UPDATE":
        case "ONLY_DRAFT_PURCHASE_ORDERS_CAN_BE_UPDATED":
        case "ONLY_DRAFT_PURCHASE_ORDERS_CAN_BE_DELETED":
        case "PURCHASE_ORDER_NOT_IN_DRAFT_STATUS":
        case "DUPLICATE_INVENTORY_ITEM":
        case "RECEIPT_NUMBER_REQUIRED":
        case "GOODS_RECEIPT_ITEMS_REQUIRED":
        case "PURCHASE_ORDER_NOT_AVAILABLE_FOR_RECEIPT":
        case "INVENTORY_ITEM_NOT_IN_PURCHASE_ORDER":
        case "RECEIVED_QUANTITY_EXCEEDS_ORDERED_QUANTITY":
            return 400;

        case "TENANT_NOT_FOUND":
        case "VENDOR_NOT_FOUND":
        case "INVENTORY_ITEM_NOT_FOUND":
        case "PURCHASE_ORDER_NOT_FOUND":
        case "INVENTORY_ITEM_NOT_FOUND_OR_INACTIVE":
            return 404;

        case "TENANT_NOT_ACTIVE":
        case "VENDOR_NOT_ACTIVE":
        case "INVENTORY_ITEM_NOT_ACTIVE":
            return 403;

        case "PO_NUMBER_ALREADY_EXISTS":
            return 409;

        case "PURCHASE_ORDER_UPDATE_FAILED":
        case "PURCHASE_ORDER_DELETE_FAILED":
        case "GOODS_RECEIPT_CREATION_FAILED":
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

function getPurchaseOrderId(req: Request): string | undefined {
    const purchaseOrderId = req.params.purchaseOrderId;

    return typeof purchaseOrderId === "string" &&
        purchaseOrderId.trim()
        ? purchaseOrderId.trim()
        : undefined;
}

export async function createPurchaseOrderController(
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
            poNumber,
            vendorId,
            orderDate,
            expectedDeliveryDate,
            items,
            taxAmount,
            notes,
        } = req.body;

        if (
            typeof poNumber !== "string" ||
            typeof vendorId !== "string" ||
            !Array.isArray(items)
        ) {
            res.status(400).json({
                success: false,
                message: "INVALID_PURCHASE_ORDER_DATA",
            });
            return;
        }

        const purchaseOrder = await createPurchaseOrderService({
            tenantId,
            poNumber,
            vendorId,
            orderDate,
            expectedDeliveryDate,
            items,
            taxAmount,
            notes,
        });

        res.status(201).json({
            success: true,
            message: "Purchase order created successfully",
            data: purchaseOrder,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getPurchaseOrdersController(
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

        const purchaseOrders =
            await getPurchaseOrdersByTenantService(tenantId);

        res.status(200).json({
            success: true,
            count: purchaseOrders.length,
            data: purchaseOrders,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getPurchaseOrderController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const purchaseOrderId = getPurchaseOrderId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!purchaseOrderId) {
            res.status(400).json({
                success: false,
                message: "PURCHASE_ORDER_ID_REQUIRED",
            });
            return;
        }

        const purchaseOrder = await getPurchaseOrderByIdService(
            purchaseOrderId,
            tenantId
        );

        res.status(200).json({
            success: true,
            data: purchaseOrder,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function updatePurchaseOrderController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const purchaseOrderId = getPurchaseOrderId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!purchaseOrderId) {
            res.status(400).json({
                success: false,
                message: "PURCHASE_ORDER_ID_REQUIRED",
            });
            return;
        }

        const {
            vendorId,
            orderDate,
            expectedDeliveryDate,
            items,
            taxAmount,
            notes,
        } = req.body;

        const purchaseOrder = await updatePurchaseOrderService(
            purchaseOrderId,
            tenantId,
            {
                vendorId,
                orderDate,
                expectedDeliveryDate,
                items,
                taxAmount,
                notes,
            }
        );

        res.status(200).json({
            success: true,
            message: "Purchase order updated successfully",
            data: purchaseOrder,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function approvePurchaseOrderController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const purchaseOrderId = getPurchaseOrderId(req);
        const approvedBy = req.auth?.userId;

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!purchaseOrderId) {
            res.status(400).json({
                success: false,
                message: "PURCHASE_ORDER_ID_REQUIRED",
            });
            return;
        }

        if (!approvedBy) {
            res.status(401).json({
                success: false,
                message: "AUTHENTICATED_USER_REQUIRED",
            });
            return;
        }

        const purchaseOrder = await approvePurchaseOrderService(
            purchaseOrderId,
            tenantId,
            approvedBy
        );

        res.status(200).json({
            success: true,
            message: "Purchase order approved successfully",
            data: purchaseOrder,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function deletePurchaseOrderController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const purchaseOrderId = getPurchaseOrderId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!purchaseOrderId) {
            res.status(400).json({
                success: false,
                message: "PURCHASE_ORDER_ID_REQUIRED",
            });
            return;
        }

        await deletePurchaseOrderService(
            purchaseOrderId,
            tenantId
        );

        res.status(200).json({
            success: true,
            message: "Purchase order deleted successfully",
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function createGoodsReceiptController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const purchaseOrderId = getPurchaseOrderId(req);
        const receivedBy = req.auth?.userId;

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!purchaseOrderId) {
            res.status(400).json({
                success: false,
                message: "PURCHASE_ORDER_ID_REQUIRED",
            });
            return;
        }

        if (!receivedBy) {
            res.status(401).json({
                success: false,
                message: "AUTHENTICATED_USER_REQUIRED",
            });
            return;
        }

        const {
            receiptNumber,
            items,
            receiptDate,
            notes,
        } = req.body;

        const goodsReceipt = await createGoodsReceiptService({
            tenantId,
            purchaseOrderId,
            receiptNumber,
            items,
            receiptDate,
            notes,
            receivedBy,
        });

        res.status(201).json({
            success: true,
            message: "Goods receipt created successfully",
            data: goodsReceipt,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function matchPurchaseOrderInvoiceController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const purchaseOrderId = getPurchaseOrderId(req);
        const invoiceId = req.params.invoiceId;

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!purchaseOrderId) {
            res.status(400).json({
                success: false,
                message: "PURCHASE_ORDER_ID_REQUIRED",
            });
            return;
        }

        if (
            typeof invoiceId !== "string" ||
            !invoiceId.trim()
        ) {
            res.status(400).json({
                success: false,
                message: "INVOICE_ID_REQUIRED",
            });
            return;
        }

        const matchingResult =
            await matchPurchaseOrderInvoiceService(
                purchaseOrderId,
                invoiceId.trim(),
                tenantId
            );

        res.status(200).json({
            success: true,
            message: "Purchase order and invoice matching completed",
            data: matchingResult,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}
