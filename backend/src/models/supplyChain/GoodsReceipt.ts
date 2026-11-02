
import mongoose, {
    Schema,
    type Document,
    type Types,
} from "mongoose";

export type GoodsReceiptStatus =
    | "draft"
    | "received"
    | "cancelled";

export interface IGoodsReceiptItem {
    inventoryId: Types.ObjectId;
    itemCode: string;
    itemName: string;
    orderedQuantity: number;
    receivedQuantity: number;
    unitCost: number;
    total: number;
}

export interface IGoodsReceipt extends Document {
    tenantId: Types.ObjectId;
    receiptNumber: string;
    purchaseOrderId: Types.ObjectId;
    vendorId: Types.ObjectId;
    receiptDate: Date;
    items: IGoodsReceiptItem[];
    status: GoodsReceiptStatus;
    notes?: string;
    receivedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const goodsReceiptItemSchema = new Schema<IGoodsReceiptItem>(
    {
        inventoryId: {
            type: Schema.Types.ObjectId,
            ref: "Inventory",
            required: true,
        },
        itemCode: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },
        itemName: {
            type: String,
            required: true,
            trim: true,
        },
        orderedQuantity: {
            type: Number,
            required: true,
            min: 0.01,
        },
        receivedQuantity: {
            type: Number,
            required: true,
            min: 0.01,
        },
        unitCost: {
            type: Number,
            required: true,
            min: 0,
        },
        total: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        _id: false,
    }
);

const goodsReceiptSchema = new Schema<IGoodsReceipt>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        receiptNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            maxlength: 40,
        },
        purchaseOrderId: {
            type: Schema.Types.ObjectId,
            ref: "PurchaseOrder",
            required: true,
        },
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: "Vendor",
            required: true,
        },
        receiptDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        items: {
            type: [goodsReceiptItemSchema],
            required: true,
            validate: {
                validator: (items: IGoodsReceiptItem[]) =>
                    items.length > 0,
                message: "A goods receipt must contain at least one item",
            },
        },
        status: {
            type: String,
            enum: ["draft", "received", "cancelled"],
            default: "received",
            required: true,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        receivedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

goodsReceiptSchema.index(
    { tenantId: 1, receiptNumber: 1 },
    { unique: true }
);

goodsReceiptSchema.index({
    tenantId: 1,
    purchaseOrderId: 1,
});

goodsReceiptSchema.index({
    tenantId: 1,
    vendorId: 1,
});

goodsReceiptSchema.index({
    tenantId: 1,
    receiptDate: -1,
});

const GoodsReceipt =
    mongoose.models.GoodsReceipt ||
    mongoose.model<IGoodsReceipt>(
        "GoodsReceipt",
        goodsReceiptSchema
    );

export default GoodsReceipt;
