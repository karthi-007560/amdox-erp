
import mongoose, { Types } from "mongoose";

import {
    createInvoice,
    findInvoiceById,
    findInvoiceByNumber,
    findInvoicesByTenant,
    updateInvoiceFinancials,
    issueInvoice,
} from "../../repositories/finance/invoiceRepository.js";

import {
    createPayment,
    findPaymentById,
    findPaymentByNumber,
    findPaymentsByInvoice,
    findPaymentsByTenant,
    updatePaymentStatus,
} from "../../repositories/finance/paymentRepository.js";

import {
    getVendorByIdAndTenant,
} from "../../repositories/supplyChain/vendorRepository.js";

import {
    getPurchaseOrderByIdAndTenant,
    getGoodsReceiptByIdAndTenant,
} from "../../repositories/supplyChain/poRepository.js";

import { findTenantById } from "../../repositories/tenantRepository.js";

import type { InvoiceStatus } from "../../models/finance/Invoice.js";
import type { PaymentStatus } from "../../models/finance/Payment.js";

const DECIMAL_FACTOR = 10n ** 18n;

const validateObjectId = (id: string, fieldName: string) => {
    if (!Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

const validateActiveTenant = async (tenantId: string) => {
    validateObjectId(tenantId, "tenant ID");

    const tenant = await findTenantById(tenantId);

    if (!tenant || tenant.status !== "active") {
        throw new Error("Tenant not found or inactive");
    }

    return tenant;
};

const getReferenceId = (value: unknown): string | undefined => {
    if (value instanceof Types.ObjectId) {
        return value.toString();
    }

    if (typeof value === "string") {
        return value;
    }

    if (
        value !== null &&
        typeof value === "object" &&
        "_id" in value
    ) {
        const id = (value as { _id: Types.ObjectId | string })._id;
        return id.toString();
    }

    return undefined;
};

const parseAmount = (value: string, fieldName: string): number => {
    const amount = Number(value);

    if (!Number.isFinite(amount) || amount < 0) {
        throw new Error(`Invalid ${fieldName}`);
    }

    return amount;
};

const toDecimalUnits = (value: string, fieldName: string): bigint => {
    const normalized = value.trim();

    if (!/^\d+(\.\d{1,18})?$/.test(normalized)) {
        throw new Error(`Invalid ${fieldName}`);
    }

    const [whole, fraction = ""] = normalized.split(".");
    const paddedFraction = fraction.padEnd(18, "0");

    return BigInt(whole) * DECIMAL_FACTOR + BigInt(paddedFraction);
};

const fromDecimalUnits = (value: bigint): string => {
    if (value < 0n) {
        throw new Error("Invalid negative monetary value");
    }

    const whole = value / DECIMAL_FACTOR;
    const fraction = (value % DECIMAL_FACTOR)
        .toString()
        .padStart(18, "0")
        .replace(/0+$/, "");

    return fraction ? `${whole}.${fraction}` : whole.toString();
};

const getInvoiceStatusAfterPayment = (
    paidAmount: bigint,
    balanceAmount: bigint
): InvoiceStatus => {
    if (balanceAmount === 0n) {
        return "paid";
    }

    if (paidAmount > 0n) {
        return "partially_paid";
    }

    return "pending";
};

const validateInvoiceSupplyChainReferences = async (
    input: {
        tenantId: string;
        vendorId?: string;
        purchaseOrderId?: string;
        goodsReceiptId?: string;
        items: {
            inventoryId?: string;
            description: string;
            quantity: string;
            unitPrice: string;
            amount: string;
        }[];
    }
) => {
    let vendorName: string | undefined;

    if (input.vendorId) {
        validateObjectId(input.vendorId, "vendor ID");

        const vendor = await getVendorByIdAndTenant(
            input.vendorId,
            input.tenantId
        );

        if (!vendor || vendor.status !== "active") {
            throw new Error("Vendor not found or inactive");
        }

        vendorName = vendor.name;
    }

    const hasSupplyChainReference =
        Boolean(input.vendorId) ||
        Boolean(input.purchaseOrderId) ||
        Boolean(input.goodsReceiptId);

    if (!hasSupplyChainReference) {
        for (const item of input.items) {
            if (item.inventoryId) {
                validateObjectId(item.inventoryId, "inventory ID");
            }
        }

        return;
    }

    if (
        !input.vendorId ||
        !input.purchaseOrderId ||
        !input.goodsReceiptId
    ) {
        throw new Error(
            "Vendor, Purchase Order, and Goods Receipt references are required together"
        );
    }

    validateObjectId(input.purchaseOrderId, "purchase order ID");
    validateObjectId(input.goodsReceiptId, "goods receipt ID");

    const purchaseOrder = await getPurchaseOrderByIdAndTenant(
        input.purchaseOrderId,
        input.tenantId
    );

    if (!purchaseOrder) {
        throw new Error("Purchase Order not found");
    }

    if (
        purchaseOrder.status === "draft" ||
        purchaseOrder.status === "cancelled"
    ) {
        throw new Error(
            "Cannot link an invoice to a draft or cancelled Purchase Order"
        );
    }

    const purchaseOrderVendorId = getReferenceId(
        purchaseOrder.vendorId
    );

    if (purchaseOrderVendorId !== input.vendorId) {
        throw new Error(
            "Invoice vendor does not match Purchase Order vendor"
        );
    }

    const goodsReceipt = await getGoodsReceiptByIdAndTenant(
        input.goodsReceiptId,
        input.tenantId
    );

    if (!goodsReceipt || goodsReceipt.status !== "received") {
        throw new Error("Received Goods Receipt not found");
    }

    if (
        goodsReceipt.purchaseOrderId.toString() !==
        input.purchaseOrderId
    ) {
        throw new Error(
            "Goods Receipt does not belong to the specified Purchase Order"
        );
    }

    if (goodsReceipt.vendorId.toString() !== input.vendorId) {
        throw new Error(
            "Goods Receipt vendor does not match invoice vendor"
        );
    }

    for (const item of input.items) {
        if (!item.inventoryId) {
            throw new Error(
                "Inventory reference is required for every invoice item linked to a Purchase Order"
            );
        }

        validateObjectId(item.inventoryId, "inventory ID");

        const purchaseOrderItem = purchaseOrder.items.find(
            (poItem: { inventoryId: Types.ObjectId }) =>
                poItem.inventoryId.toString() === item.inventoryId
        );

        if (!purchaseOrderItem) {
            throw new Error(
                `Inventory item ${item.inventoryId} does not belong to the Purchase Order`
            );
        }

        const receiptItem = goodsReceipt.items.find(
            (grItem: { inventoryId: Types.ObjectId }) =>
                grItem.inventoryId.toString() === item.inventoryId
        );

        if (!receiptItem) {
            throw new Error(
                `Inventory item ${item.inventoryId} does not belong to the Goods Receipt`
            );
        }
    }

    return vendorName;
};

export const createPayableInvoiceService = async (
    input: {
        tenantId: string;
        invoiceNumber: string;
        partyName: string;
        partyEmail?: string;
        invoiceDate: Date;
        dueDate: Date;
        description?: string;

        vendorId?: string;
        purchaseOrderId?: string;
        goodsReceiptId?: string;

        items: {
            inventoryId?: string;
            description: string;
            quantity: string;
            unitPrice: string;
            amount: string;
        }[];

        subtotal: string;
        taxAmount: string;
        totalAmount: string;
        createdBy: string;
    }
) => {
    await validateActiveTenant(input.tenantId);

    validateObjectId(input.createdBy, "creator ID");

    if (!input.invoiceNumber.trim() || !input.partyName.trim()) {
        throw new Error("Invoice number and party name are required");
    }

    if (input.invoiceDate > input.dueDate) {
        throw new Error("Invoice date cannot be after due date");
    }

    if (!input.items || input.items.length === 0) {
        throw new Error("Invoice must contain at least one item");
    }

    const existingInvoice = await findInvoiceByNumber(
        input.invoiceNumber,
        input.tenantId
    );

    if (existingInvoice) {
        throw new Error("Invoice number already exists");
    }

    await validateInvoiceSupplyChainReferences(input);

    const subtotal = parseAmount(input.subtotal, "subtotal");
    const taxAmount = parseAmount(input.taxAmount, "tax amount");
    const totalAmount = parseAmount(input.totalAmount, "total amount");

    if (Math.abs(subtotal + taxAmount - totalAmount) > 0.000001) {
        throw new Error("Invoice total does not match subtotal and tax");
    }

    for (const item of input.items) {
        const quantity = Number(item.quantity);
        const unitPrice = parseAmount(item.unitPrice, "item unit price");
        const amount = parseAmount(item.amount, "item amount");

        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new Error("Item quantity must be greater than zero");
        }

        if (Math.abs(quantity * unitPrice - amount) > 0.000001) {
            throw new Error("Invoice item amount is incorrect");
        }
    }

    return createInvoice({
        ...input,
        invoiceType: "payable",
        paidAmount: "0",
        balanceAmount: totalAmount.toString(),
    });
};

export const getPayableInvoiceService = async (
    invoiceId: string,
    tenantId: string
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(invoiceId, "invoice ID");

    const invoice = await findInvoiceById(invoiceId, tenantId);

    if (!invoice || invoice.invoiceType !== "payable") {
        throw new Error("Payable invoice not found");
    }

    return invoice;
};

export const issuePayableInvoiceService = async (
    invoiceId: string,
    tenantId: string
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(invoiceId, "invoice ID");

    const invoice = await findInvoiceById(invoiceId, tenantId);

    if (!invoice || invoice.invoiceType !== "payable") {
        throw new Error("Payable invoice not found");
    }

    if (invoice.status !== "draft") {
        throw new Error("Only draft invoices can be issued");
    }

    const issuedInvoice = await issueInvoice(invoiceId, tenantId);

    if (!issuedInvoice) {
        throw new Error("Invoice could not be issued. Please retry");
    }

    return issuedInvoice;
};

export const getPayableInvoicesService = async (
    tenantId: string,
    status?: InvoiceStatus
) => {
    await validateActiveTenant(tenantId);

    return findInvoicesByTenant(tenantId, "payable", status);
};

export const recordPayablePaymentService = async (
    input: {
        tenantId: string;
        invoiceId: string;
        paymentNumber: string;
        partyName: string;
        paymentDate: Date;
        amount: string;
        paymentMethod:
            | "cash"
            | "bank_transfer"
            | "cheque"
            | "credit_card"
            | "other";
        transactionReference?: string;
        description?: string;
        createdBy: string;
    }
) => {
    await validateActiveTenant(input.tenantId);

    validateObjectId(input.invoiceId, "invoice ID");
    validateObjectId(input.createdBy, "creator ID");

    if (!input.paymentNumber.trim()) {
        throw new Error("Payment number is required");
    }

    const amount = toDecimalUnits(input.amount, "payment amount");

    if (amount <= 0n) {
        throw new Error("Payment amount must be positive");
    }

    const session = await mongoose.startSession();

    let createdPayment: Awaited<ReturnType<typeof createPayment>> | null = null;

    try {
        await session.withTransaction(async () => {
            const invoice = await findInvoiceById(
                input.invoiceId,
                input.tenantId,
                session
            );

            if (!invoice || invoice.invoiceType !== "payable") {
                throw new Error("Payable invoice not found");
            }

            if (
                invoice.status !== "pending" &&
                invoice.status !== "partially_paid" &&
                invoice.status !== "overdue"
            ) {
                if (invoice.status === "draft") {
                    throw new Error("Cannot pay a draft invoice. Issue the invoice first");
                }

                throw new Error("Cannot pay a cancelled or fully paid invoice");
            }

            const existingPayment = await findPaymentByNumber(
                input.paymentNumber,
                input.tenantId,
                session
            );

            if (existingPayment) {
                throw new Error("Payment number already exists");
            }

            const currentPaid = toDecimalUnits(
                invoice.paidAmount.toString(),
                "invoice paid amount"
            );

            const currentBalance = toDecimalUnits(
                invoice.balanceAmount.toString(),
                "invoice balance amount"
            );

            if (amount > currentBalance) {
                throw new Error(
                    "Payment amount must be positive and cannot exceed outstanding balance"
                );
            }

            const newPaid = currentPaid + amount;
            const newBalance = currentBalance - amount;

            const newStatus = getInvoiceStatusAfterPayment(
                newPaid,
                newBalance
            );

            const payment = await createPayment(
                {
                    ...input,
                    paymentType: "payable",
                    status: "completed",
                },
                session
            );

            const updatedInvoice = await updateInvoiceFinancials(
                {
                    invoiceId: input.invoiceId,
                    tenantId: input.tenantId,
                    expectedPaidAmount: invoice.paidAmount.toString(),
                    expectedBalanceAmount: invoice.balanceAmount.toString(),
                    paidAmount: fromDecimalUnits(newPaid),
                    balanceAmount: fromDecimalUnits(newBalance),
                    status: newStatus,
                },
                session
            );

            if (!updatedInvoice) {
                throw new Error(
                    "Invoice balance changed during payment. Please retry"
                );
            }

            createdPayment = payment;
        });
    } finally {
        await session.endSession();
    }

    if (!createdPayment) {
        throw new Error("Unable to record payable payment");
    }

    return createdPayment;
};

export const getPayablePaymentsService = async (
    tenantId: string,
    status?: PaymentStatus
) => {
    await validateActiveTenant(tenantId);

    return findPaymentsByTenant(tenantId, "payable", status);
};

export const getInvoicePaymentsService = async (
    invoiceId: string,
    tenantId: string
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(invoiceId, "invoice ID");

    const invoice = await findInvoiceById(invoiceId, tenantId);

    if (!invoice || invoice.invoiceType !== "payable") {
        throw new Error("Payable invoice not found");
    }

    return findPaymentsByInvoice(invoiceId, tenantId);
};

export const updatePayablePaymentStatusService = async (
    paymentId: string,
    tenantId: string,
    status: PaymentStatus
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(paymentId, "payment ID");

    const allowedStatuses: PaymentStatus[] = [
        "completed",
        "failed",
        "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
        throw new Error("Invalid payment status update");
    }

    const session = await mongoose.startSession();

    let updatedPayment: Awaited<ReturnType<typeof updatePaymentStatus>> | null =
        null;

    try {
        await session.withTransaction(async () => {
            const payment = await findPaymentById(
                paymentId,
                tenantId,
                session
            );

            if (!payment || payment.paymentType !== "payable") {
                throw new Error("Payment not found");
            }

            if (payment.status === status) {
                updatedPayment = payment;
                return;
            }

            const invoice = await findInvoiceById(
                payment.invoiceId.toString(),
                tenantId,
                session
            );

            if (!invoice || invoice.invoiceType !== "payable") {
                throw new Error("Payable invoice not found");
            }

            const paymentAmount = toDecimalUnits(
                payment.amount.toString(),
                "payment amount"
            );

            let newPaid = toDecimalUnits(
                invoice.paidAmount.toString(),
                "invoice paid amount"
            );

            let newBalance = toDecimalUnits(
                invoice.balanceAmount.toString(),
                "invoice balance amount"
            );

            const wasCompleted = payment.status === "completed";
            const willBeCompleted = status === "completed";

            if (wasCompleted && !willBeCompleted) {
                newPaid -= paymentAmount;
                newBalance += paymentAmount;

                if (newPaid < 0n) {
                    throw new Error("Invalid invoice payment balance");
                }
            } else if (!wasCompleted && willBeCompleted) {
                if (paymentAmount > newBalance) {
                    throw new Error(
                        "Payment amount exceeds the invoice outstanding balance"
                    );
                }

                newPaid += paymentAmount;
                newBalance -= paymentAmount;
            }

            if (wasCompleted !== willBeCompleted) {
                const newInvoiceStatus = getInvoiceStatusAfterPayment(
                    newPaid,
                    newBalance
                );

                const updatedInvoice = await updateInvoiceFinancials(
                    {
                        invoiceId: invoice._id.toString(),
                        tenantId,
                        expectedPaidAmount: invoice.paidAmount.toString(),
                        expectedBalanceAmount: invoice.balanceAmount.toString(),
                        paidAmount: fromDecimalUnits(newPaid),
                        balanceAmount: fromDecimalUnits(newBalance),
                        status: newInvoiceStatus,
                    },
                    session
                );

                if (!updatedInvoice) {
                    throw new Error(
                        "Invoice balance changed during payment status update. Please retry"
                    );
                }
            }

            const result = await updatePaymentStatus(
                paymentId,
                tenantId,
                payment.status,
                status,
                session
            );

            if (!result) {
                throw new Error(
                    "Payment status changed during update. Please retry"
                );
            }

            updatedPayment = result;
        });
    } finally {
        await session.endSession();
    }

    if (!updatedPayment) {
        throw new Error("Unable to update payable payment status");
    }

    return updatedPayment;
};
