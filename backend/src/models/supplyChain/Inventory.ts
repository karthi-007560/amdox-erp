import mongoose, { Schema, type Document, type Types } from "mongoose";

export type InventoryStatus = "active" | "inactive";

export interface IInventory extends Document {
    tenantId: Types.ObjectId;
    itemCode: string;
    name: string;
    description?: string;
    category?: string;
    unit: string;
    quantity: number;
    reservedQuantity: number;
    reorderLevel: number;
    unitCost: number;
    warehouse?: string;
    status: InventoryStatus;
    createdBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        itemCode: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            maxlength: 30,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        category: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        unit: {
            type: String,
            required: true,
            trim: true,
            maxlength: 30,
        },
        quantity: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        reservedQuantity: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        reorderLevel: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        unitCost: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },
        warehouse: {
            type: String,
            trim: true,
            maxlength: 150,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);


inventorySchema.index(
    { tenantId: 1, itemCode: 1 },
    { unique: true }
);

inventorySchema.index({ tenantId: 1, name: 1 });
inventorySchema.index({ tenantId: 1, category: 1 });

const Inventory =
    mongoose.models.Inventory ||
    mongoose.model<IInventory>("Inventory", inventorySchema);

export default Inventory;