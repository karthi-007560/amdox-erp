
import mongoose, { Schema, type Document } from "mongoose";

export type PayrollStatus = "draft" | "processed" | "paid";

export interface ISalaryComponent {
    name: string;
    amount: number;
}

export interface IPayroll extends Document {
    employeeId: mongoose.Types.ObjectId;
    tenantId: mongoose.Types.ObjectId;

    periodStart: Date;
    periodEnd: Date;

    currency: string;
    baseSalary: number;

    allowances: ISalaryComponent[];
    deductions: ISalaryComponent[];

    workingDays: number;
    presentDays: number;
    halfDays: number;
    unpaidLeaveDays: number;
    overtimeHours: number;

    overtimePay: number;
    unpaidLeaveDeduction: number;

    grossSalary: number;
    totalDeductions: number;
    netSalary: number;

    status: PayrollStatus;
    processedBy?: mongoose.Types.ObjectId;
    processedAt?: Date;
    paidAt?: Date;
}

const salaryComponentSchema = new Schema<ISalaryComponent>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const payrollSchema = new Schema<IPayroll>(
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
        periodStart: {
            type: Date,
            required: true,
        },
        periodEnd: {
            type: Date,
            required: true,
        },
        currency: {
            type: String,
            default: "INR",
            uppercase: true,
            trim: true,
        },
        baseSalary: {
            type: Number,
            required: true,
            min: 0,
        },
        allowances: {
            type: [salaryComponentSchema],
            default: [],
        },
        deductions: {
            type: [salaryComponentSchema],
            default: [],
        },
        workingDays: {
            type: Number,
            required: true,
            min: 0,
        },
        presentDays: {
            type: Number,
            default: 0,
            min: 0,
        },
        halfDays: {
            type: Number,
            default: 0,
            min: 0,
        },
        unpaidLeaveDays: {
            type: Number,
            default: 0,
            min: 0,
        },
        overtimeHours: {
            type: Number,
            default: 0,
            min: 0,
        },
        overtimePay: {
            type: Number,
            default: 0,
            min: 0,
        },
        unpaidLeaveDeduction: {
            type: Number,
            default: 0,
            min: 0,
        },
        grossSalary: {
            type: Number,
            required: true,
            min: 0,
        },
        totalDeductions: {
            type: Number,
            required: true,
            min: 0,
        },
        netSalary: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["draft", "processed", "paid"],
            default: "draft",
            required: true,
        },
        processedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        processedAt: {
            type: Date,
        },
        paidAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

payrollSchema.index(
    {
        tenantId: 1,
        employeeId: 1,
        periodStart: 1,
        periodEnd: 1,
    },
    { unique: true }
);

const Payroll =
    mongoose.models.Payroll ||
    mongoose.model<IPayroll>("Payroll", payrollSchema);

export default Payroll;
