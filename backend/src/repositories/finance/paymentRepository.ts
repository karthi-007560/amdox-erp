
import { ClientSession, Types } from "mongoose";

import {
    Payment,
    PaymentStatus,
    PaymentType,
} from "../../models/finance/Payment.js";

interface CreatePaymentInput {
    tenantId: string;
    paymentNumber: string;
    paymentType: PaymentType;
    invoiceId: string;
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
    status?: PaymentStatus;
    createdBy: string;
}

export const createPayment = async (
    input: CreatePaymentInput,
    session?: ClientSession
) => {
    const payment = new Payment({
        ...input,
        tenantId: new Types.ObjectId(input.tenantId),
        invoiceId: new Types.ObjectId(input.invoiceId),
        createdBy: new Types.ObjectId(input.createdBy),
        amount: Types.Decimal128.fromString(input.amount),
    });

    if (session) {
        return payment.save({ session });
    }

    return payment.save();
};

export const findPaymentById = async (
    paymentId: string,
    tenantId: string,
    session?: ClientSession
) => {
    const query = Payment.findOne({
        _id: paymentId,
        tenantId,
    });

    if (session) query.session(session);

    return query;
};

export const findPaymentByNumber = async (
    paymentNumber: string,
    tenantId: string,
    session?: ClientSession
) => {
    const query = Payment.findOne({
        paymentNumber: paymentNumber.trim().toUpperCase(),
        tenantId,
    }).populate("invoiceId");

    if (session) query.session(session);

    return query;
};

export const findPaymentsByTenant = async (
    tenantId: string,
    paymentType?: PaymentType,
    status?: PaymentStatus,
    session?: ClientSession
) => {
    const filter: {
        tenantId: string;
        paymentType?: PaymentType;
        status?: PaymentStatus;
    } = { tenantId };

    if (paymentType) filter.paymentType = paymentType;
    if (status) filter.status = status;

    const query = Payment.find(filter)
        .populate("invoiceId")
        .sort({ paymentDate: -1, createdAt: -1 });

    if (session) query.session(session);

    return query;
};

export const findPaymentsByInvoice = async (
    invoiceId: string,
    tenantId: string,
    session?: ClientSession
) => {
    const query = Payment.find({
        invoiceId,
        tenantId,
    }).sort({ paymentDate: -1, createdAt: -1 });

    if (session) query.session(session);

    return query;
};


export const updatePaymentStatus = async (
    paymentId: string,
    tenantId: string,
    expectedStatus: PaymentStatus,
    status: PaymentStatus,
    session: ClientSession
) => {
    return Payment.findOneAndUpdate(
        {
            _id: paymentId,
            tenantId,
            status: expectedStatus,
        },
        {
            $set: { status },
        },
        {
            new: true,
            runValidators: true,
            session,
        }
    );
};

export const deletePayment = async (
    paymentId: string,
    tenantId: string,
    session?: ClientSession
) => {
    return Payment.findOneAndDelete(
        {
            _id: paymentId,
            tenantId,
            status: "pending",
        },
        session ? { session } : {}
    );
};
