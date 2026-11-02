
import type { Request, Response, NextFunction } from "express";

import {
    createReceivableInvoiceService,
    getReceivableInvoiceService,
    getReceivableInvoicesService,
    recordReceivablePaymentService,
    getReceivablePaymentsService,
    getReceivableInvoicePaymentsService,
    updateReceivablePaymentStatusService,
} from "../../services/finance/arService.js";

import type { InvoiceStatus } from "../../models/finance/Invoice.js";
import type {
    PaymentStatus,
    PaymentMethod,
} from "../../models/finance/Payment.js";

const INVOICE_STATUSES: InvoiceStatus[] = [
    "draft",
    "pending",
    "partially_paid",
    "paid",
    "overdue",
    "cancelled",
];

const PAYMENT_STATUSES: PaymentStatus[] = [
    "pending",
    "completed",
    "failed",
    "cancelled",
];

const PAYMENT_METHODS: PaymentMethod[] = [
    "cash",
    "bank_transfer",
    "cheque",
    "credit_card",
    "other",
];

function getErrorStatus(error: unknown): number {
    const message = error instanceof Error ? error.message : "";

    if (
        message.startsWith("Invalid ") ||
        message.startsWith("Invalid payment")
    ) {
        return 400;
    }

    switch (message) {
        case "Invoice number and party name are required":
        case "Invoice date cannot be after due date":
        case "Invoice must contain at least one item":
        case "Invoice total does not match subtotal and tax":
        case "Invoice item amount is incorrect":
        case "Payment number is required":
        case "Payment amount must be positive and cannot exceed outstanding balance":
        case "Cannot receive payment for a cancelled invoice":
            return 400;

        case "Receivable invoice not found":
        case "Payment not found":
            return 404;

        case "Invoice number already exists":
        case "Payment number already exists":
        case "Tenant not found or inactive":
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
    if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
    ) {
        res.status(409).json({
            success: false,
            message: "A record with this number already exists.",
        });
        return;
    }

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

function getParam(
    req: Request,
    key: string
): string | undefined {
    const value = req.params[key];

    return typeof value === "string" && value.trim()
        ? value.trim()
        : undefined;
}

function getCreatorId(req: Request): string | undefined {
    return req.auth?.userId;
}

function parseDate(value: unknown): Date | undefined {
    if (typeof value !== "string" || !value.trim()) {
        return undefined;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? undefined : date;
}

function isOptionalString(value: unknown): boolean {
    return value === undefined || typeof value === "string";
}


export async function createReceivableInvoiceController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const createdBy = getCreatorId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!createdBy) {
            res.status(401).json({
                success: false,
                message: "AUTHENTICATED_USER_REQUIRED",
            });
            return;
        }

        const body = req.body ?? {};

        const invoiceDate = parseDate(body.invoiceDate);
        const dueDate = parseDate(body.dueDate);

        if (
            typeof body.invoiceNumber !== "string" ||
            typeof body.partyName !== "string" ||
            !invoiceDate ||
            !dueDate ||
            !Array.isArray(body.items) ||
            body.items.length === 0
        ) {
            res.status(400).json({
                success: false,
                message: "INVALID_INVOICE_DETAILS",
            });
            return;
        }

        if (
            !isOptionalString(body.partyEmail) ||
            !isOptionalString(body.description)
        ) {
            res.status(400).json({
                success: false,
                message: "INVALID_INVOICE_OPTIONAL_FIELDS",
            });
            return;
        }

        const validItems = body.items.every((item: unknown) => {
            if (typeof item !== "object" || item === null) {
                return false;
            }

            const line = item as Record<string, unknown>;

            return (
                typeof line.description === "string" &&
                typeof line.quantity === "string" &&
                typeof line.unitPrice === "string" &&
                typeof line.amount === "string"
            );
        });

        if (!validItems) {
            res.status(400).json({
                success: false,
                message: "INVALID_INVOICE_ITEMS",
            });
            return;
        }

        if (
            typeof body.subtotal !== "string" ||
            typeof body.taxAmount !== "string" ||
            typeof body.totalAmount !== "string"
        ) {
            res.status(400).json({
                success: false,
                message: "INVALID_INVOICE_AMOUNTS",
            });
            return;
        }

        const invoice = await createReceivableInvoiceService({
            tenantId,
            createdBy,
            invoiceNumber: body.invoiceNumber,
            partyName: body.partyName,
            partyEmail: body.partyEmail,
            invoiceDate,
            dueDate,
            description: body.description,
            items: body.items,
            subtotal: body.subtotal,
            taxAmount: body.taxAmount,
            totalAmount: body.totalAmount,
        });

        res.status(201).json({
            success: true,
            message: "Receivable invoice created successfully.",
            data: invoice,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}


export async function getReceivableInvoicesController(
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

        const status = req.query.status;

        if (
            status !== undefined &&
            (typeof status !== "string" ||
                !INVOICE_STATUSES.includes(status as InvoiceStatus))
        ) {
            res.status(400).json({
                success: false,
                message: "INVALID_INVOICE_STATUS",
            });
            return;
        }

        const invoices = await getReceivableInvoicesService(
            tenantId,
            status as InvoiceStatus | undefined
        );

        res.status(200).json({
            success: true,
            count: invoices.length,
            data: invoices,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}


export async function getReceivableInvoiceController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const invoiceId = getParam(req, "invoiceId");

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!invoiceId) {
            res.status(400).json({
                success: false,
                message: "INVOICE_ID_REQUIRED",
            });
            return;
        }

        const invoice = await getReceivableInvoiceService(
            invoiceId,
            tenantId
        );

        res.status(200).json({
            success: true,
            data: invoice,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}


export async function recordReceivablePaymentController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const createdBy = getCreatorId(req);
        const body = req.body ?? {};

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!createdBy) {
            res.status(401).json({
                success: false,
                message: "AUTHENTICATED_USER_REQUIRED",
            });
            return;
        }

        const paymentDate = parseDate(body.paymentDate);

        if (
            typeof body.invoiceId !== "string" ||
            typeof body.paymentNumber !== "string" ||
            typeof body.partyName !== "string" ||
            typeof body.amount !== "string" ||
            !paymentDate
        ) {
            res.status(400).json({
                success: false,
                message: "INVALID_PAYMENT_DETAILS",
            });
            return;
        }

        if (
            typeof body.paymentMethod !== "string" ||
            !PAYMENT_METHODS.includes(body.paymentMethod as PaymentMethod)
        ) {
            res.status(400).json({
                success: false,
                message: "INVALID_PAYMENT_METHOD",
            });
            return;
        }

        if (
            !isOptionalString(body.transactionReference) ||
            !isOptionalString(body.description)
        ) {
            res.status(400).json({
                success: false,
                message: "INVALID_PAYMENT_OPTIONAL_FIELDS",
            });
            return;
        }

        const payment = await recordReceivablePaymentService({
            tenantId,
            createdBy,
            invoiceId: body.invoiceId,
            paymentNumber: body.paymentNumber,
            partyName: body.partyName,
            paymentDate,
            amount: body.amount,
            paymentMethod: body.paymentMethod as PaymentMethod,
            transactionReference: body.transactionReference,
            description: body.description,
        });

        res.status(201).json({
            success: true,
            message: "Receivable payment recorded successfully.",
            data: payment,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}


export async function getReceivablePaymentsController(
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

        const status = req.query.status;

        if (
            status !== undefined &&
            (typeof status !== "string" ||
                !PAYMENT_STATUSES.includes(status as PaymentStatus))
        ) {
            res.status(400).json({
                success: false,
                message: "INVALID_PAYMENT_STATUS",
            });
            return;
        }

        const payments = await getReceivablePaymentsService(
            tenantId,
            status as PaymentStatus | undefined
        );

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}


export async function getReceivableInvoicePaymentsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const invoiceId = getParam(req, "invoiceId");

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!invoiceId) {
            res.status(400).json({
                success: false,
                message: "INVOICE_ID_REQUIRED",
            });
            return;
        }

        const payments = await getReceivableInvoicePaymentsService(
            invoiceId,
            tenantId
        );

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}


export async function updateReceivablePaymentStatusController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const paymentId = getParam(req, "paymentId");
        const status = req.body?.status;

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!paymentId) {
            res.status(400).json({
                success: false,
                message: "PAYMENT_ID_REQUIRED",
            });
            return;
        }

        if (
            typeof status !== "string" ||
            !PAYMENT_STATUSES.includes(status as PaymentStatus)
        ) {
            res.status(400).json({
                success: false,
                message: "INVALID_PAYMENT_STATUS",
            });
            return;
        }

        const payment = await updateReceivablePaymentStatusService(
            paymentId,
            tenantId,
            status as PaymentStatus
        );

        res.status(200).json({
            success: true,
            message: "Receivable payment status updated successfully.",
            data: payment,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}
