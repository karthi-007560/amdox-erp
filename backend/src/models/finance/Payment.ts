
import mongoose, { Schema, Document, Types } from "mongoose";

export type PaymentType = "payable" | "receivable";

export type PaymentMethod =
    | "cash"
    | "bank_transfer"
    | "cheque"
    | "credit_card"
    | "other";

export type PaymentStatus =
    | "pending"
    | "completed"
    | "failed"
    | "cancelled";

export interface IPayment extends Document {
    tenantId: Types.ObjectId;
    paymentNumber: string;
    paymentType: PaymentType;
    invoiceId: Types.ObjectId;
    partyName: string;
    paymentDate: Date;
    amount: Types.Decimal128;
    paymentMethod: PaymentMethod;
    transactionReference?: string;
    description?: string;
    status: PaymentStatus;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        paymentNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            maxlength: 50,
        },
        paymentType: {
            type: String,
            enum: ["payable", "receivable"],
            required: true,
        },
        invoiceId: {
            type: Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
        },
        partyName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        paymentDate: {
            type: Date,
            required: true,
        },
        amount: {
            type: Schema.Types.Decimal128,
            required: true,
            min: 0.01,
        },
        paymentMethod: {
            type: String,
            enum: [
                "cash",
                "bank_transfer",
                "cheque",
                "credit_card",
                "other",
            ],
            required: true,
        },
        transactionReference: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed", "cancelled"],
            default: "pending",
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index(
    { tenantId: 1, paymentNumber: 1 },
    { unique: true }
);

paymentSchema.index({ tenantId: 1, invoiceId: 1 });
paymentSchema.index({ tenantId: 1, paymentDate: -1 });
paymentSchema.index({ tenantId: 1, status: 1 });

export const Payment = mongoose.model<IPayment>(
    "Payment",
    paymentSchema
);
