
import mongoose, { Schema, type Document } from "mongoose";

export type EmployeeStatus = "active" | "inactive" | "on-leave";

export interface IEmployeeSalaryComponent {
    name: string;
    amount: number;
}

export interface IEmployeeCompensation {
    baseSalary: number;
    allowances: IEmployeeSalaryComponent[];
    deductions: IEmployeeSalaryComponent[];
    currency: string;
    effectiveFrom?: Date;
}

export interface IEmployee extends Document {
    userId: mongoose.Types.ObjectId;
    tenantId: mongoose.Types.ObjectId;
    employeeId: string;
    department?: string;
    designation?: string;
    phone?: string;
    dateOfJoining?: Date;
    status: EmployeeStatus;
    compensation?: IEmployeeCompensation;
}

const salaryComponentSchema =
    new Schema<IEmployeeSalaryComponent>(
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

const compensationSchema =
    new Schema<IEmployeeCompensation>(
        {
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
            currency: {
                type: String,
                default: "INR",
                uppercase: true,
                trim: true,
            },
            effectiveFrom: {
                type: Date,
            },
        },
        { _id: false }
    );

const employeeSchema = new Schema<IEmployee>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        employeeId: {
            type: String,
            required: true,
            trim: true,
        },
        department: {
            type: String,
            trim: true,
        },
        designation: {
            type: String,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        dateOfJoining: {
            type: Date,
        },
        status: {
            type: String,
            enum: ["active", "inactive", "on-leave"],
            default: "active",
            required: true,
        },
        compensation: {
            type: compensationSchema,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

employeeSchema.index(
    { tenantId: 1, employeeId: 1 },
    { unique: true }
);

const Employee =
    mongoose.models.Employee ||
    mongoose.model<IEmployee>("Employee", employeeSchema);

export default Employee;
