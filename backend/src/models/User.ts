
import mongoose, { Schema, Document, Types } from "mongoose";
import type { UserRole } from "../types/auth.js";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    isActive: boolean;
    tenantId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: ["admin", "manager", "employee"],
            default: "employee",
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            required: true,
        },
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

export const User = mongoose.model<IUser>("User", userSchema);
