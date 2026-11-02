
import mongoose, { Schema, type Document, type Types } from "mongoose";

export type ResourceStatus = "allocated" | "available" | "released";

export interface IResource extends Document {
    tenantId: Types.ObjectId;
    projectId: Types.ObjectId;
    userId: Types.ObjectId;
    role: string;
    allocationPercentage: number;
    startDate: Date;
    endDate?: Date;
    hourlyRate?: number;
    currency: string;
    status: ResourceStatus;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const resourceSchema = new Schema<IResource>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        role: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        allocationPercentage: {
            type: Number,
            required: true,
            min: 1,
            max: 100
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date
        },
        hourlyRate: {
            type: Number,
            min: 0
        },
        currency: {
            type: String,
            default: "INR",
            uppercase: true,
            trim: true,
            minlength: 3,
            maxlength: 3
        },
        status: {
            type: String,
            enum: ["allocated", "available", "released"],
            default: "allocated",
            required: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

resourceSchema.index({ tenantId: 1, projectId: 1, userId: 1 });
resourceSchema.index({ tenantId: 1, userId: 1, status: 1 });

const Resource =
    mongoose.models.Resource ||
    mongoose.model<IResource>("Resource", resourceSchema);

export default Resource;
