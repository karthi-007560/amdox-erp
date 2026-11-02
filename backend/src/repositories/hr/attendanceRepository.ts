
import Attendance from "../../models/hr/Attendance.js";
import type { IAttendance } from "../../models/hr/Attendance.js";

export async function createAttendance(
    attendanceData: Partial<IAttendance>
) {
    return Attendance.create(attendanceData);
}

export async function getAttendanceById(
    attendanceId: string,
    tenantId: string
) {
    return Attendance.findOne({
        _id: attendanceId,
        tenantId,
    }).populate("employeeId").populate("tenantId", "name code");
}

export async function getAttendanceByEmployeeAndDate(
    employeeId: string,
    tenantId: string,
    date: Date
) {
    return Attendance.findOne({
        employeeId,
        tenantId,
        date,
    });
}

export async function getAttendancesByTenant(
    tenantId: string
) {
    return Attendance.find({ tenantId }).populate("employeeId").sort({ date: -1, createdAt: -1 });
}

export async function updateAttendance(
    attendanceId: string,
    tenantId: string,
    updateData: Partial<IAttendance>
) {
    return Attendance.findOneAndUpdate(
        {
            _id: attendanceId,
            tenantId,
        },
        {
            $set: updateData,
        },
        {
            new: true,
            runValidators: true,
        }
    ).populate("employeeId").populate("tenantId", "name code");
}

export async function deleteAttendance(
    attendanceId: string,
    tenantId: string
) {
    return Attendance.findOneAndDelete({
        _id: attendanceId,
        tenantId,
    });
}

export async function getAttendanceByEmployeeAndDateRange(
    employeeId: string,
    tenantId: string,
    startDate: Date,
    endDate: Date
) {
    return Attendance.find({
        employeeId,
        tenantId,
        date: {
            $gte: startDate,
            $lte: endDate,
        },
    }).sort({ date: 1 });
}
