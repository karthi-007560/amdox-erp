
import mongoose, { Schema, type Document, type Types } from "mongoose";

export type BudgetStatus = "draft" | "approved" | "active" | "closed";

export interface IBudget extends Document {
    tenantId: Types.ObjectId;
    projectId: Types.ObjectId;
    budgetCode: string;
    name: string;
    description?: string;
    totalAmount: number;
    spentAmount: number;
    currency: string;
    fiscalYear?: string;
    status: BudgetStatus;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const budgetSchema = new Schema<IBudget>(
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
        budgetCode: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            maxlength: 50
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
            maxlength: 2000
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        spentAmount: {
            type: Number,
            default: 0,
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
        fiscalYear: {
            type: String,
            trim: true,
            maxlength: 20
        },
        status: {
            type: String,
            enum: ["draft", "approved", "active", "closed"],
            default: "draft",
            required: true
        },
        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        approvedAt: {
            type: Date
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

budgetSchema.index(
    { tenantId: 1, budgetCode: 1 },
    { unique: true }
);

budgetSchema.index({ tenantId: 1, projectId: 1, status: 1 });

const Budget =
    mongoose.models.Budget ||
    mongoose.model<IBudget>("Budget", budgetSchema);

export default Budget;
