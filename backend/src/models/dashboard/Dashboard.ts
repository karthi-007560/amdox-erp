import mongoose, { Schema, type Document, type Types } from "mongoose";

export type DashboardLayout = "grid" | "list";

export interface IDashboard extends Document {
    tenantId: Types.ObjectId;
    userId: Types.ObjectId;
    name: string;
    description?: string;
    layout: DashboardLayout;
    isDefault: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const dashboardSchema = new Schema<IDashboard>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500
        },
        layout: {
            type: String,
            enum: ["grid", "list"],
            default: "grid",
            required: true
        },
        isDefault: {
            type: Boolean,
            default: false
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

dashboardSchema.index(
    { tenantId: 1, userId: 1, name: 1 },
    { unique: true }
);

dashboardSchema.index({ tenantId: 1, userId: 1, isDefault: 1 });

const Dashboard =
    mongoose.models.Dashboard ||
    mongoose.model<IDashboard>("Dashboard", dashboardSchema);

export default Dashboard;