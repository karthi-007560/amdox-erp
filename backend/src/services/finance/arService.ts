
import mongoose, { Types } from "mongoose";

import {
    createInvoice,
    findInvoiceById,
    findInvoiceByNumber,
    findInvoicesByTenant,
    updateInvoiceFinancials,
} from "../../repositories/finance/invoiceRepository.js";

import {
    createPayment,
    findPaymentById,
    findPaymentByNumber,
    findPaymentsByInvoice,
    findPaymentsByTenant,
    updatePaymentStatus,
} from "../../repositories/finance/paymentRepository.js";

import { findTenantById } from "../../repositories/tenantRepository.js";

import type { InvoiceStatus } from "../../models/finance/Invoice.js";
import type { PaymentStatus } from "../../models/finance/Payment.js";

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

const parseAmount = (value: string, fieldName: string): number => {
    const amount = Number(value);

    if (!Number.isFinite(amount) || amount < 0) {
        throw new Error(`Invalid ${fieldName}`);
    }

    return amount;
};

const DECIMAL_FACTOR = 10n ** 18n;

const toDecimalUnits = (value: string): bigint => {
    const normalized = value.trim();

    if (!/^\d+(\.\d{1,18})?$/.test(normalized)) {
        throw new Error("Invalid decimal amount");
    }

    const [whole, fraction = ""] = normalized.split(".");

    return (
        BigInt(whole) * DECIMAL_FACTOR +
        BigInt(fraction.padEnd(18, "0"))
    );
};

const fromDecimalUnits = (value: bigint): string => {
    if (value < 0n) {
        throw new Error("Amount cannot be negative");
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

export const createReceivableInvoiceService = async (
    input: {
        tenantId: string;
        invoiceNumber: string;
        partyName: string;
        partyEmail?: string;
        invoiceDate: Date;
        dueDate: Date;
        description?: string;
        items: {
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
        invoiceType: "receivable",
        paidAmount: "0",
        balanceAmount: totalAmount.toString(),
    });
};

export const getReceivableInvoiceService = async (
    invoiceId: string,
    tenantId: string
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(invoiceId, "invoice ID");

    const invoice = await findInvoiceById(invoiceId, tenantId);

    if (!invoice || invoice.invoiceType !== "receivable") {
        throw new Error("Receivable invoice not found");
    }

    return invoice;
};

export const getReceivableInvoicesService = async (
    tenantId: string,
    status?: InvoiceStatus
) => {
    await validateActiveTenant(tenantId);

    return findInvoicesByTenant(tenantId, "receivable", status);
};

export const recordReceivablePaymentService = async (
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

    const amount = toDecimalUnits(input.amount);

    if (amount <= 0n) {
        throw new Error(
            "Payment amount must be positive and cannot exceed outstanding balance"
        );
    }

    const session = await mongoose.startSession();

    try {
        let createdPayment: Awaited<ReturnType<typeof createPayment>> | null = null;

        await session.withTransaction(async () => {
            const invoice = await findInvoiceById(
                input.invoiceId,
                input.tenantId,
                session
            );

            if (!invoice || invoice.invoiceType !== "receivable") {
                throw new Error("Receivable invoice not found");
            }

            if (
                invoice.status !== "pending" &&
                invoice.status !== "partially_paid" &&
                invoice.status !== "overdue"
            ) {
                if (invoice.status === "draft") {
                    throw new Error(
                        "Cannot receive payment for a draft invoice. Issue the invoice first."
                    );
                }

                if (invoice.status === "cancelled") {
                    throw new Error(
                        "Cannot receive payment for a cancelled invoice"
                    );
                }

                throw new Error("Invoice is not eligible for payment");
            }

            const existingPayment = await findPaymentByNumber(
                input.paymentNumber,
                input.tenantId,
                session
            );

            if (existingPayment) {
                throw new Error("Payment number already exists");
            }

            const oldPaid = toDecimalUnits(invoice.paidAmount.toString());
            const oldBalance = toDecimalUnits(invoice.balanceAmount.toString());

            if (amount > oldBalance) {
                throw new Error(
                    "Payment amount must be positive and cannot exceed outstanding balance"
                );
            }

            const newPaid = oldPaid + amount;
            const newBalance = oldBalance - amount;

            const newStatus = getInvoiceStatusAfterPayment(
                newPaid,
                newBalance
            );

            createdPayment = await createPayment(
                {
                    ...input,
                    paymentType: "receivable",
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
                    "Invoice balance changed during payment. Please retry."
                );
            }
        });

        if (!createdPayment) {
            throw new Error("Payment could not be created");
        }

        return createdPayment;
    } finally {
        await session.endSession();
    }
};

export const getReceivablePaymentsService = async (
    tenantId: string,
    status?: PaymentStatus
) => {
    await validateActiveTenant(tenantId);

    return findPaymentsByTenant(tenantId, "receivable", status);
};

export const getReceivableInvoicePaymentsService = async (
    invoiceId: string,
    tenantId: string
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(invoiceId, "invoice ID");

    const invoice = await findInvoiceById(invoiceId, tenantId);

    if (!invoice || invoice.invoiceType !== "receivable") {
        throw new Error("Receivable invoice not found");
    }

    return findPaymentsByInvoice(invoiceId, tenantId);
};

export const updateReceivablePaymentStatusService = async (
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

    try {
        let updatedPayment: Awaited<
            ReturnType<typeof updatePaymentStatus>
        > = null;

        await session.withTransaction(async () => {
            const payment = await findPaymentById(
                paymentId,
                tenantId,
                session
            );

            if (!payment || payment.paymentType !== "receivable") {
                throw new Error("Payment not found");
            }

            if (payment.status === status) {
                updatedPayment = payment;
                return;
            }

            const invoiceId = payment.invoiceId.toString();

            const invoice = await findInvoiceById(
                invoiceId,
                tenantId,
                session
            );

            if (!invoice || invoice.invoiceType !== "receivable") {
                throw new Error("Receivable invoice not found");
            }

            const amount = toDecimalUnits(payment.amount.toString());

            const oldPaid = toDecimalUnits(invoice.paidAmount.toString());
            const oldBalance = toDecimalUnits(invoice.balanceAmount.toString());

            let newPaid = oldPaid;
            let newBalance = oldBalance;
            let newInvoiceStatus: InvoiceStatus = invoice.status;

            if (payment.status === "completed" && status !== "completed") {
                if (invoice.status === "cancelled") {
                    throw new Error(
                        "Cannot reverse payment on a cancelled invoice"
                    );
                }

                if (amount > oldPaid) {
                    throw new Error("Payment reversal exceeds paid amount");
                }

                newPaid = oldPaid - amount;
                newBalance = oldBalance + amount;

                newInvoiceStatus = newPaid === 0n
                    ? "pending"
                    : "partially_paid";
            }

            if (payment.status !== "completed" && status === "completed") {
                if (
                    invoice.status !== "pending" &&
                    invoice.status !== "partially_paid" &&
                    invoice.status !== "overdue"
                ) {
                    throw new Error("Invoice is not eligible for payment");
                }

                if (amount <= 0n || amount > oldBalance) {
                    throw new Error(
                        "Payment amount must be positive and cannot exceed outstanding balance"
                    );
                }

                newPaid = oldPaid + amount;
                newBalance = oldBalance - amount;

                newInvoiceStatus = getInvoiceStatusAfterPayment(
                    newPaid,
                    newBalance
                );
            }

            if (newPaid !== oldPaid || newBalance !== oldBalance) {
                const updatedInvoice = await updateInvoiceFinancials(
                    {
                        invoiceId,
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
                        "Invoice balance changed during payment status update. Please retry."
                    );
                }
            }

            updatedPayment = await updatePaymentStatus(
                paymentId,
                tenantId,
                payment.status,
                status,
                session
            );

            if (!updatedPayment) {
                throw new Error(
                    "Payment status changed during this operation. Please retry."
                );
            }
        });

        if (!updatedPayment) {
            throw new Error("Payment status could not be updated");
        }

        return updatedPayment;
    } finally {
        await session.endSession();
    }
};
