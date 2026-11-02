
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITenantIntegration {
    provider: string;
    enabled: boolean;
    settings?: Map<string, string>;
    configuredAt?: Date;
}

export interface ITenantSettings {
    timezone?: string;
    language?: string;
    dateFormat?: string;
    currency?: string;
    notifications?: {
        email: boolean;
        sms: boolean;
        inApp: boolean;
    };
    integrations?: ITenantIntegration[];
}

export interface ITenant extends Document {
    name: string;
    code: string;
    status: "active" | "inactive" | "suspended";
    settings?: ITenantSettings;
    createdBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const tenantIntegrationSchema = new Schema<ITenantIntegration>(
    {
        provider: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        enabled: {
            type: Boolean,
            default: false,
        },
        settings: {
            type: Map,
            of: String,
            default: {},
        },
        configuredAt: {
            type: Date,
        },
    },
    { _id: false }
);

const tenantSettingsSchema = new Schema<ITenantSettings>(
    {
        timezone: {
            type: String,
            trim: true,
        },
        language: {
            type: String,
            trim: true,
            lowercase: true,
        },
        dateFormat: {
            type: String,
            trim: true,
        },
        currency: {
            type: String,
            trim: true,
            uppercase: true,
            minlength: 3,
            maxlength: 3,
        },
        notifications: {
            email: {
                type: Boolean,
                default: true,
            },
            sms: {
                type: Boolean,
                default: false,
            },
            inApp: {
                type: Boolean,
                default: true,
            },
        },
        integrations: {
            type: [tenantIntegrationSchema],
            default: [],
        },
    },
    { _id: false }
);

const tenantSchema = new Schema<ITenant>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
            maxlength: 30,
        },
        status: {
            type: String,
            enum: ["active", "inactive", "suspended"],
            default: "active",
            required: true,
        },
        settings: {
            type: tenantSettingsSchema,
            default: {},
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

export const Tenant =
    mongoose.models.Tenant ||
    mongoose.model<ITenant>("Tenant", tenantSchema);
