import mongoose from "mongoose";

import Attendance from "../../models/hr/Attendance.js";
import Employee from "../../models/hr/Employee.js";

import {
    createAttendance,
    getAttendanceById,
    getAttendanceByEmployeeAndDate,
    getAttendancesByTenant,
    updateAttendance,
    deleteAttendance,
} from "../../repositories/hr/attendanceRepository.js";

import { getEmployeeByIdAndTenant } from "../../repositories/hr/employeeRepository.js";

import type {
    IAttendance,
    AttendanceStatus,
} from "../../models/hr/Attendance.js";

interface CreateAttendanceInput {
    employeeId: string;
    tenantId: string;
    date: string;
    checkIn?: Date;
    checkOut?: Date;
    status?: AttendanceStatus;
    remarks?: string;
}

interface UpdateAttendanceInput {
    date?: string;
    checkIn?: Date;
    checkOut?: Date;
    status?: AttendanceStatus;
    remarks?: string;
}

function normalizeAttendanceDate(date: string | Date): Date {
    const dateString =
        date instanceof Date ? date.toISOString().slice(0, 10) : date;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        throw new Error("INVALID_ATTENDANCE_DATE");
    }

    const normalizedDate = new Date(`${dateString}T00:00:00.000Z`);

    if (
        Number.isNaN(normalizedDate.getTime()) ||
        normalizedDate.toISOString().slice(0, 10) !== dateString
    ) {
        throw new Error("INVALID_ATTENDANCE_DATE");
    }

    return normalizedDate;
}

function validateAttendanceTimes(
    checkIn?: Date,
    checkOut?: Date
) {
    if (checkIn && Number.isNaN(new Date(checkIn).getTime())) {
        throw new Error("INVALID_CHECK_IN_TIME");
    }

    if (checkOut && Number.isNaN(new Date(checkOut).getTime())) {
        throw new Error("INVALID_CHECK_OUT_TIME");
    }

    if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
        throw new Error("CHECK_OUT_MUST_BE_AFTER_CHECK_IN");
    }
}

export async function createAttendanceService(
    attendanceData: CreateAttendanceInput
) {
    const {
        employeeId,
        tenantId,
        date,
        checkIn,
        checkOut,
        status,
        remarks,
    } = attendanceData;

    if (
        !mongoose.isValidObjectId(employeeId) ||
        !mongoose.isValidObjectId(tenantId)
    ) {
        throw new Error("INVALID_EMPLOYEE_OR_TENANT_ID");
    }

    const employee = await getEmployeeByIdAndTenant(
        employeeId,
        tenantId
    );

    if (!employee) {
        throw new Error("EMPLOYEE_NOT_FOUND_IN_TENANT");
    }

    if (employee.status !== "active") {
        throw new Error("EMPLOYEE_IS_NOT_ACTIVE");
    }

    const normalizedDate = normalizeAttendanceDate(date);

    validateAttendanceTimes(checkIn, checkOut);

    const existingAttendance = await getAttendanceByEmployeeAndDate(
        employeeId,
        tenantId,
        normalizedDate
    );

    if (existingAttendance) {
        throw new Error("ATTENDANCE_ALREADY_EXISTS");
    }

    try {
        return await createAttendance({
            employeeId: new mongoose.Types.ObjectId(employeeId),
            tenantId: new mongoose.Types.ObjectId(tenantId),
            date: normalizedDate,
            checkIn,
            checkOut,
            status: status || "present",
            remarks,
        });
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000
        ) {
            throw new Error("ATTENDANCE_ALREADY_EXISTS");
        }

        throw error;
    }
}

export async function getAttendanceByIdService(
    attendanceId: string,
    tenantId: string
) {
    if (
        !mongoose.isValidObjectId(attendanceId) ||
        !mongoose.isValidObjectId(tenantId)
    ) {
        throw new Error("INVALID_ATTENDANCE_OR_TENANT_ID");
    }

    const attendance = await getAttendanceById(
        attendanceId,
        tenantId
    );

    if (!attendance) {
        throw new Error("ATTENDANCE_NOT_FOUND");
    }

    return attendance;
}

export async function getAttendancesByTenantService(
    tenantId: string
) {
    if (!mongoose.isValidObjectId(tenantId)) {
        throw new Error("INVALID_TENANT_ID");
    }

    return getAttendancesByTenant(tenantId);
}

export async function updateAttendanceService(
    attendanceId: string,
    tenantId: string,
    updateData: UpdateAttendanceInput
) {
    if (
        !mongoose.isValidObjectId(attendanceId) ||
        !mongoose.isValidObjectId(tenantId)
    ) {
        throw new Error("INVALID_ATTENDANCE_OR_TENANT_ID");
    }

    const existingAttendance = await getAttendanceById(
        attendanceId,
        tenantId
    );

    if (!existingAttendance) {
        throw new Error("ATTENDANCE_NOT_FOUND");
    }

    const updatedData: Partial<IAttendance> = {};

    if (updateData.date !== undefined) {
        updatedData.date = normalizeAttendanceDate(updateData.date);
    }

    if (updateData.checkIn !== undefined) {
        updatedData.checkIn = updateData.checkIn;
    }

    if (updateData.checkOut !== undefined) {
        updatedData.checkOut = updateData.checkOut;
    }

    if (updateData.status !== undefined) {
        updatedData.status = updateData.status;
    }

    if (updateData.remarks !== undefined) {
        updatedData.remarks = updateData.remarks;
    }

    validateAttendanceTimes(
        updatedData.checkIn ?? existingAttendance.checkIn,
        updatedData.checkOut ?? existingAttendance.checkOut
    );

    try {
        const updatedAttendance = await updateAttendance(
            attendanceId,
            tenantId,
            updatedData
        );

        if (!updatedAttendance) {
            throw new Error("ATTENDANCE_NOT_FOUND");
        }

        return updatedAttendance;
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000
        ) {
            throw new Error("ATTENDANCE_ALREADY_EXISTS");
        }

        throw error;
    }
}

export async function deleteAttendanceService(
    attendanceId: string,
    tenantId: string
) {
    if (
        !mongoose.isValidObjectId(attendanceId) ||
        !mongoose.isValidObjectId(tenantId)
    ) {
        throw new Error("INVALID_ATTENDANCE_OR_TENANT_ID");
    }

    const deletedAttendance = await deleteAttendance(
        attendanceId,
        tenantId
    );

    if (!deletedAttendance) {
        throw new Error("ATTENDANCE_NOT_FOUND");
    }

    return deletedAttendance;
}