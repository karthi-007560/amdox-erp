
import mongoose, { Schema, type Document } from "mongoose";

export type AttendanceStatus =
    | "present"
    | "absent"
    | "half-day"
    | "on-leave";

export interface IAttendance extends Document {
    employeeId: mongoose.Types.ObjectId;
    tenantId: mongoose.Types.ObjectId;
    date: Date;
    checkIn?: Date;
    checkOut?: Date;
    status: AttendanceStatus;
    remarks?: string;
}

const attendanceSchema = new Schema<IAttendance>(
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
        date: {
            type: Date,
            required: true,
        },
        checkIn: {
            type: Date,
        },
        checkOut: {
            type: Date,
        },
        status: {
            type: String,
            enum: ["present", "absent", "half-day", "on-leave"],
            default: "present",
            required: true,
        },
        remarks: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

attendanceSchema.index(
    { tenantId: 1, employeeId: 1, date: 1 },
    { unique: true }
);

const Attendance =
    mongoose.models.Attendance ||
    mongoose.model<IAttendance>("Attendance", attendanceSchema);

export default Attendance;
