
import mongoose, { Schema, type Document, type Types } from "mongoose";

export type VendorStatus = "active" | "inactive";

export interface IVendor extends Document {
    tenantId: Types.ObjectId;
    vendorCode: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    taxId?: string;
    paymentTermsDays: number;
    status: VendorStatus;
    notes?: string;
    createdBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        vendorCode: {
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
        contactPerson: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 150,
        },
        phone: {
            type: String,
            trim: true,
            maxlength: 20,
        },
        website: {
            type: String,
            trim: true,
            maxlength: 200,
        },
        address: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        taxId: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: 30,
        },
        paymentTermsDays: {
            type: Number,
            default: 30,
            min: 0,
            max: 365,
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
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
    },
    {
        timestamps: true,
    }
);

vendorSchema.index(
    { tenantId: 1, vendorCode: 1 },
    { unique: true }
);


vendorSchema.index({ tenantId: 1, name: 1 });

const Vendor =
    mongoose.models.Vendor ||
    mongoose.model<IVendor>("Vendor", vendorSchema);

export default Vendor;
