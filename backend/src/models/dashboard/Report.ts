import mongoose, { Schema, type Document, type Types } from "mongoose";

export type ReportType =
    | "financial"
    | "hr"
    | "sales"
    | "inventory"
    | "project"
    | "custom";

export type ReportStatus = "draft" | "published" | "archived";

export interface IReport extends Document {
    tenantId: Types.ObjectId;
    createdBy: Types.ObjectId;
    name: string;
    description?: string;
    type: ReportType;
    filters: Record<string, unknown>;
    columns: string[];
    status: ReportStatus;
    isShared: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        type: {
            type: String,
            enum: ["financial", "hr", "sales", "inventory", "project", "custom"],
            required: true
        },
        filters: {
            type: Schema.Types.Mixed,
            default: {}
        },
        columns: {
            type: [String],
            default: []
        },
        status: {
            type: String,
            enum: ["draft", "published", "archived"],
            default: "draft"
        },
        isShared: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

reportSchema.index({ tenantId: 1, createdAt: -1 });
reportSchema.index({ tenantId: 1, createdBy: 1, name: 1 });

const Report =
    mongoose.models.Report ||
    mongoose.model<IReport>("Report", reportSchema);

export default Report;