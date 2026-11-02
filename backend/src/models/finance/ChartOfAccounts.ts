
import mongoose, { Schema, Document, Types } from "mongoose";

export type AccountType =
    | "asset"
    | "liability"
    | "equity"
    | "revenue"
    | "expense";

export interface IChartOfAccounts extends Document {
    tenantId: Types.ObjectId;
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    description?: string;
    parentAccount?: Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const chartOfAccountsSchema = new Schema<IChartOfAccounts>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        accountCode: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            maxlength: 30,
        },
        accountName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        accountType: {
            type: String,
            enum: [
                "asset",
                "liability",
                "equity",
                "revenue",
                "expense",
            ],
            required: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        parentAccount: {
            type: Schema.Types.ObjectId,
            ref: "ChartOfAccounts",
            required: false,
        },
        isActive: {
            type: Boolean,
            default: true,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

chartOfAccountsSchema.index(
    { tenantId: 1, accountCode: 1 },
    { unique: true }
);

export const ChartOfAccounts = mongoose.model<IChartOfAccounts>(
    "ChartOfAccounts",
    chartOfAccountsSchema
);
