
import mongoose, { Schema, Document, Types } from "mongoose";

export type InvoiceType = "payable" | "receivable";

export type InvoiceStatus =
    | "draft"
    | "pending"
    | "partially_paid"
    | "paid"
    | "overdue"
    | "cancelled";

export interface IInvoiceItem {
    inventoryId?: Types.ObjectId;
    description: string;
    quantity: Types.Decimal128;
    unitPrice: Types.Decimal128;
    amount: Types.Decimal128;
}

export interface IInvoice extends Document {
    tenantId: Types.ObjectId;

    invoiceNumber: string;
    invoiceType: InvoiceType;

    // Supply Chain references for Three-Way Matching.
    vendorId?: Types.ObjectId;
    purchaseOrderId?: Types.ObjectId;
    goodsReceiptId?: Types.ObjectId;

    partyName: string;
    partyEmail?: string;

    invoiceDate: Date;
    dueDate: Date;

    description?: string;

    items: IInvoiceItem[];

    subtotal: Types.Decimal128;
    taxAmount: Types.Decimal128;
    totalAmount: Types.Decimal128;

    paidAmount: Types.Decimal128;
    balanceAmount: Types.Decimal128;

    status: InvoiceStatus;

    createdBy: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
    {
        inventoryId: {
            type: Schema.Types.ObjectId,
            ref: "Inventory",
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300,
        },

        quantity: {
            type: Schema.Types.Decimal128,
            required: true,
            min: 0.000001,
        },

        unitPrice: {
            type: Schema.Types.Decimal128,
            required: true,
            min: 0,
        },

        amount: {
            type: Schema.Types.Decimal128,
            required: true,
            min: 0,
        },
    },
    {
        _id: false,
    }
);

const invoiceSchema = new Schema<IInvoice>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },

        invoiceNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            maxlength: 50,
        },

        invoiceType: {
            type: String,
            enum: ["payable", "receivable"],
            required: true,
        },

        // Optional references used by Supply Chain matching.
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: "Vendor",
        },

        purchaseOrderId: {
            type: Schema.Types.ObjectId,
            ref: "PurchaseOrder",
        },

        goodsReceiptId: {
            type: Schema.Types.ObjectId,
            ref: "GoodsReceipt",
        },

        partyName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        partyEmail: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 150,
        },

        invoiceDate: {
            type: Date,
            required: true,
        },

        dueDate: {
            type: Date,
            required: true,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },

        items: {
            type: [invoiceItemSchema],
            required: true,
            validate: {
                validator: (items: IInvoiceItem[]) =>
                    items.length > 0,
                message: "An invoice must contain at least one item.",
            },
        },

        subtotal: {
            type: Schema.Types.Decimal128,
            required: true,
            min: 0,
        },

        taxAmount: {
            type: Schema.Types.Decimal128,
            required: true,
            default: "0",
            min: 0,
        },

        totalAmount: {
            type: Schema.Types.Decimal128,
            required: true,
            min: 0,
        },

        paidAmount: {
            type: Schema.Types.Decimal128,
            required: true,
            default: "0",
            min: 0,
        },

        balanceAmount: {
            type: Schema.Types.Decimal128,
            required: true,
            min: 0,
        },

        status: {
            type: String,
            enum: [
                "draft",
                "pending",
                "partially_paid",
                "paid",
                "overdue",
                "cancelled",
            ],
            default: "draft",
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


invoiceSchema.index(
    { tenantId: 1, invoiceNumber: 1 },
    { unique: true }
);

invoiceSchema.index(
    { tenantId: 1, invoiceType: 1, status: 1 }
);

invoiceSchema.index(
    { tenantId: 1, dueDate: 1 }
);


invoiceSchema.index({
    tenantId: 1,
    purchaseOrderId: 1,
});

invoiceSchema.index({
    tenantId: 1,
    goodsReceiptId: 1,
});

export const Invoice =
    mongoose.models.Invoice ||
    mongoose.model<IInvoice>("Invoice", invoiceSchema);
