import mongoose, {
    Schema,
    type Document,
    type Types,
} from "mongoose";

export type PurchaseOrderStatus =
    | "draft"
    | "approved"
    | "partially_received"
    | "received"
    | "cancelled";

export interface IPurchaseOrderItem {
    inventoryId: Types.ObjectId;
    itemCode: string;
    itemName: string;
    quantity: number;
    receivedQuantity: number;
    unitCost: number;
    total: number;
}

export interface IPurchaseOrder extends Document {
    tenantId: Types.ObjectId;
    poNumber: string;
    vendorId: Types.ObjectId;
    orderDate: Date;
    expectedDeliveryDate?: Date;
    items: IPurchaseOrderItem[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    status: PurchaseOrderStatus;
    notes?: string;
    createdBy?: Types.ObjectId;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const purchaseOrderItemSchema = new Schema<IPurchaseOrderItem>(
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
        quantity: {
            type: Number,
            required: true,
            min: 0.01,
        },
        receivedQuantity: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
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

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        poNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            maxlength: 40,
        },
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: "Vendor",
            required: true,
        },
        orderDate: {
            type: Date,
            required: true,
            default: Date.now,
        },
        expectedDeliveryDate: {
            type: Date,
        },
        items: {
            type: [purchaseOrderItemSchema],
            required: true,
            validate: {
                validator: (items: IPurchaseOrderItem[]) =>
                    items.length > 0,
                message: "A purchase order must contain at least one item",
            },
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        taxAmount: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: [
                "draft",
                "approved",
                "partially_received",
                "received",
                "cancelled",
            ],
            default: "draft",
            required: true,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        approvedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);


purchaseOrderSchema.index(
    { tenantId: 1, poNumber: 1 },
    { unique: true }
);

purchaseOrderSchema.index({ tenantId: 1, vendorId: 1 });
purchaseOrderSchema.index({ tenantId: 1, status: 1 });
purchaseOrderSchema.index({ tenantId: 1, orderDate: -1 });

const PurchaseOrder =
    mongoose.models.PurchaseOrder ||
    mongoose.model<IPurchaseOrder>(
        "PurchaseOrder",
        purchaseOrderSchema
    );

export default PurchaseOrder;