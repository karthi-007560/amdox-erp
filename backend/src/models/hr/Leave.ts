import mongoose, { Schema, type Document } from "mongoose";

export type LeaveType =
    | "casual"
    | "sick"
    | "earned"
    | "unpaid"
    | "other";

export type LeaveStatus =
    | "pending"
    | "approved"
    | "rejected"
    | "cancelled";

export interface ILeave extends Document {
    employeeId: mongoose.Types.ObjectId;
    tenantId: mongoose.Types.ObjectId;
    leaveType: LeaveType;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    reason: string;
    status: LeaveStatus;
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    rejectionReason?: string;
}

const leaveSchema = new Schema<ILeave>(
    {
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: "Employee",
            required: true,
        },
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        leaveType: {
            type: String,
            enum: ["casual", "sick", "earned", "unpaid", "other"],
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        totalDays: {
            type: Number,
            required: true,
            min: 1,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "cancelled"],
            default: "pending",
            required: true,
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        reviewedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

leaveSchema.index({
    tenantId: 1,
    employeeId: 1,
    startDate: 1,
    endDate: 1,
});

const Leave =
    mongoose.models.Leave ||
    mongoose.model<ILeave>("Leave", leaveSchema);

export default Leave;
