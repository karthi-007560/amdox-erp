
import mongoose, { Schema, type Document } from "mongoose";

export interface IPayslip extends Document {
    tenantId: mongoose.Types.ObjectId;
    employeeId: mongoose.Types.ObjectId;
    payrollId: mongoose.Types.ObjectId;

    payslipNumber: string;
    issueDate: Date;

    status: "generated" | "published";

    generatedBy: mongoose.Types.ObjectId;
    publishedAt?: Date;
}

const payslipSchema = new Schema<IPayslip>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        employeeId: {
            type: Schema.Types.ObjectId,
            ref: "Employee",
            required: true,
        },
        payrollId: {
            type: Schema.Types.ObjectId,
            ref: "Payroll",
            required: true,
            unique: true,
        },
        payslipNumber: {
            type: String,
            required: true,
            trim: true,
        },
        issueDate: {
            type: Date,
            default: Date.now,
            required: true,
        },
        status: {
            type: String,
            enum: ["generated", "published"],
            default: "generated",
            required: true,
        },
        generatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        publishedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

payslipSchema.index(
    { tenantId: 1, payslipNumber: 1 },
    { unique: true }
);

const Payslip =
    mongoose.models.Payslip ||
    mongoose.model<IPayslip>("Payslip", payslipSchema);

export default Payslip;
