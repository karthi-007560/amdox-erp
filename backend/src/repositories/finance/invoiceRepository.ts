
import { ClientSession, Types } from "mongoose";

import {
    Invoice,
    InvoiceStatus,
    InvoiceType,
} from "../../models/finance/Invoice.js";

interface CreateInvoiceInput {
    tenantId: string;
    invoiceNumber: string;
    invoiceType: InvoiceType;

    // Supply Chain references for Three-Way Matching.
    vendorId?: string;
    purchaseOrderId?: string;
    goodsReceiptId?: string;

    partyName: string;
    partyEmail?: string;
    invoiceDate: Date;
    dueDate: Date;
    description?: string;

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
    paidAmount: string;
    balanceAmount: string;
    createdBy: string;
}

export const createInvoice = async (
    input: CreateInvoiceInput,
    session?: ClientSession
) => {
    const invoice = new Invoice({
        ...input,

        tenantId: new Types.ObjectId(input.tenantId),
        createdBy: new Types.ObjectId(input.createdBy),

        // Convert optional Supply Chain references.
        vendorId: input.vendorId
            ? new Types.ObjectId(input.vendorId)
            : undefined,

        purchaseOrderId: input.purchaseOrderId
            ? new Types.ObjectId(input.purchaseOrderId)
            : undefined,

        goodsReceiptId: input.goodsReceiptId
            ? new Types.ObjectId(input.goodsReceiptId)
            : undefined,

        items: input.items.map((item) => ({
            ...item,

            inventoryId: item.inventoryId
                ? new Types.ObjectId(item.inventoryId)
                : undefined,

            quantity: Types.Decimal128.fromString(item.quantity),
            unitPrice: Types.Decimal128.fromString(item.unitPrice),
            amount: Types.Decimal128.fromString(item.amount),
        })),

        subtotal: Types.Decimal128.fromString(input.subtotal),
        taxAmount: Types.Decimal128.fromString(input.taxAmount),
        totalAmount: Types.Decimal128.fromString(input.totalAmount),
        paidAmount: Types.Decimal128.fromString(input.paidAmount),
        balanceAmount: Types.Decimal128.fromString(input.balanceAmount),
    });

    if (session) {
        return invoice.save({ session });
    }

    return invoice.save();
};

export const findInvoiceById = async (
    invoiceId: string,
    tenantId: string,
    session?: ClientSession
) => {
    const query = Invoice.findOne({
        _id: invoiceId,
        tenantId,
    });

    if (session) query.session(session);

    return query;
};

export const findInvoiceByNumber = async (
    invoiceNumber: string,
    tenantId: string,
    session?: ClientSession
) => {
    const query = Invoice.findOne({
        invoiceNumber: invoiceNumber.trim().toUpperCase(),
        tenantId,
    });

    if (session) query.session(session);

    return query;
};

export const findInvoicesByTenant = async (
    tenantId: string,
    invoiceType?: InvoiceType,
    status?: InvoiceStatus,
    session?: ClientSession
) => {
    const filter: {
        tenantId: string;
        invoiceType?: InvoiceType;
        status?: InvoiceStatus;
    } = { tenantId };

    if (invoiceType) filter.invoiceType = invoiceType;
    if (status) filter.status = status;

    const query = Invoice.find(filter).sort({
        invoiceDate: -1,
        createdAt: -1,
    });

    if (session) query.session(session);

    return query;
};

export const updateInvoice = async (
    invoiceId: string,
    tenantId: string,
    updates: Record<string, unknown>,
    session?: ClientSession
) => {
    return Invoice.findOneAndUpdate(
        { _id: invoiceId, tenantId },
        { $set: updates },
        {
            new: true,
            runValidators: true,
            ...(session ? { session } : {}),
        }
    );
};

export const issueInvoice = async (
    invoiceId: string,
    tenantId: string,
    session?: ClientSession
) => {
    return Invoice.findOneAndUpdate(
        {
            _id: invoiceId,
            tenantId,
            status: "draft",
        },
        {
            $set: {
                status: "pending",
            },
        },
        {
            new: true,
            runValidators: true,
            ...(session ? { session } : {}),
        }
    );
};

export const updateInvoiceFinancials = async (
    input: {
        invoiceId: string;
        tenantId: string;
        expectedPaidAmount: string;
        expectedBalanceAmount: string;
        paidAmount: string;
        balanceAmount: string;
        status: InvoiceStatus;
    },
    session: ClientSession
) => {
    return Invoice.findOneAndUpdate(
        {
            _id: input.invoiceId,
            tenantId: input.tenantId,
            paidAmount: Types.Decimal128.fromString(
                input.expectedPaidAmount
            ),
            balanceAmount: Types.Decimal128.fromString(
                input.expectedBalanceAmount
            ),
        },
        {
            $set: {
                paidAmount: Types.Decimal128.fromString(
                    input.paidAmount
                ),
                balanceAmount: Types.Decimal128.fromString(
                    input.balanceAmount
                ),
                status: input.status,
            },
        },
        {
            new: true,
            runValidators: true,
            session,
        }
    );
};

export const updateInvoiceStatus = async (
    invoiceId: string,
    tenantId: string,
    status: InvoiceStatus,
    session?: ClientSession
) => {
    return Invoice.findOneAndUpdate(
        { _id: invoiceId, tenantId },
        { $set: { status } },
        {
            new: true,
            runValidators: true,
            ...(session ? { session } : {}),
        }
    );
};

export const deleteInvoice = async (
    invoiceId: string,
    tenantId: string,
    session?: ClientSession
) => {
    return Invoice.findOneAndDelete(
        {
            _id: invoiceId,
            tenantId,
            status: "draft",
        },
        session ? { session } : {}
    );
};
