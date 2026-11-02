
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICurrency extends Document {
    tenantId: Types.ObjectId;
    code: string;
    name: string;
    symbol: string;
    exchangeRate: Types.Decimal128;
    isBaseCurrency: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const currencySchema = new Schema<ICurrency>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        code: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
            minlength: 3,
            maxlength: 3,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        symbol: {
            type: String,
            required: true,
            trim: true,
            maxlength: 10,
        },
        exchangeRate: {
            type: Schema.Types.Decimal128,
            required: true,
            default: "1",
            min: 0.000001,
        },
        isBaseCurrency: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

currencySchema.index(
    { tenantId: 1, code: 1 },
    { unique: true }
);

currencySchema.index(
    { tenantId: 1, isBaseCurrency: 1 },
    {
        unique: true,
        partialFilterExpression: { isBaseCurrency: true },
    }
);

export const Currency = mongoose.model<ICurrency>(
    "Currency",
    currencySchema
);
