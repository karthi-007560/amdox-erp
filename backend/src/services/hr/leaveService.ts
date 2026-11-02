
import mongoose from "mongoose";

import {
    createLeave,
    getLeaveById,
    getLeaveByEmployeeAndDateRange,
    getLeavesByTenant,
    getLeavesByEmployee,
    updateLeave,
    deleteLeave,
} from "../../repositories/hr/leaveRepository.js";

import { getEmployeeByIdAndTenant } from "../../repositories/hr/employeeRepository.js";

import type {
    ILeave,
    LeaveType,
} from "../../models/hr/Leave.js";

interface CreateLeaveInput {
    employeeId: string;
    tenantId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
}

function normalizeLeaveDate(date: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error("INVALID_LEAVE_DATE");
    }

    const normalizedDate = new Date(`${date}T00:00:00.000Z`);

    if (
        Number.isNaN(normalizedDate.getTime()) ||
        normalizedDate.toISOString().slice(0, 10) !== date
    ) {
        throw new Error("INVALID_LEAVE_DATE");
    }

    return normalizedDate;
}

function calculateTotalDays(
    startDate: Date,
    endDate: Date
): number {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    return (
        Math.floor(
            (endDate.getTime() - startDate.getTime()) /
                millisecondsPerDay
        ) + 1
    );
}

function validateObjectIds(...ids: string[]) {
    if (!ids.every((id) => mongoose.isValidObjectId(id))) {
        throw new Error("INVALID_ID");
    }
}


export async function createLeaveService(
    leaveData: CreateLeaveInput
) {
    const {
        employeeId,
        tenantId,
        leaveType,
        startDate,
        endDate,
        reason,
    } = leaveData;

    validateObjectIds(employeeId, tenantId);

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

    const normalizedStartDate = normalizeLeaveDate(startDate);
    const normalizedEndDate = normalizeLeaveDate(endDate);

    if (normalizedEndDate < normalizedStartDate) {
        throw new Error("END_DATE_BEFORE_START_DATE");
    }

    const totalDays = calculateTotalDays(
        normalizedStartDate,
        normalizedEndDate
    );

    const overlappingLeave =
        await getLeaveByEmployeeAndDateRange(
            employeeId,
            tenantId,
            normalizedStartDate,
            normalizedEndDate
        );

    if (overlappingLeave.length > 0) {
        throw new Error("LEAVE_DATE_OVERLAP");
    }

    return createLeave({
        employeeId: new mongoose.Types.ObjectId(employeeId),
        tenantId: new mongoose.Types.ObjectId(tenantId),
        leaveType,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        totalDays,
        reason,
        status: "pending",
    });
}


export async function getLeaveByIdService(
    leaveId: string,
    tenantId: string
) {
    validateObjectIds(leaveId, tenantId);

    const leave = await getLeaveById(leaveId, tenantId);

    if (!leave) {
        throw new Error("LEAVE_NOT_FOUND");
    }

    return leave;
}


export async function getLeavesByTenantService(
    tenantId: string
) {
    validateObjectIds(tenantId);

    return getLeavesByTenant(tenantId);
}

export async function getLeavesByEmployeeService(
    employeeId: string,
    tenantId: string
) {
    validateObjectIds(employeeId, tenantId);

    const employee = await getEmployeeByIdAndTenant(
        employeeId,
        tenantId
    );

    if (!employee) {
        throw new Error("EMPLOYEE_NOT_FOUND_IN_TENANT");
    }

    return getLeavesByEmployee(employeeId, tenantId);
}


export async function approveLeaveService(
    leaveId: string,
    tenantId: string,
    reviewerId: string
) {
    validateObjectIds(leaveId, tenantId, reviewerId);

    const leave = await getLeaveById(leaveId, tenantId);

    if (!leave) {
        throw new Error("LEAVE_NOT_FOUND");
    }

    if (leave.status !== "pending") {
        throw new Error("LEAVE_IS_NOT_PENDING");
    }

    const updatedLeave = await updateLeave(
        leaveId,
        tenantId,
        {
            status: "approved",
            reviewedBy: new mongoose.Types.ObjectId(reviewerId),
            reviewedAt: new Date(),
        }
    );

    if (!updatedLeave) {
        throw new Error("LEAVE_NOT_FOUND");
    }

    return updatedLeave;
}


export async function rejectLeaveService(
    leaveId: string,
    tenantId: string,
    reviewerId: string,
    rejectionReason: string
) {
    validateObjectIds(leaveId, tenantId, reviewerId);

    if (!rejectionReason.trim()) {
        throw new Error("REJECTION_REASON_REQUIRED");
    }

    const leave = await getLeaveById(leaveId, tenantId);

    if (!leave) {
        throw new Error("LEAVE_NOT_FOUND");
    }

    if (leave.status !== "pending") {
        throw new Error("LEAVE_IS_NOT_PENDING");
    }

    const updatedLeave = await updateLeave(
        leaveId,
        tenantId,
        {
            status: "rejected",
            reviewedBy: new mongoose.Types.ObjectId(reviewerId),
            reviewedAt: new Date(),
            rejectionReason: rejectionReason.trim(),
        }
    );

    if (!updatedLeave) {
        throw new Error("LEAVE_NOT_FOUND");
    }

    return updatedLeave;
}


export async function deleteLeaveService(
    leaveId: string,
    tenantId: string
) {
    validateObjectIds(leaveId, tenantId);

    const leave = await getLeaveById(leaveId, tenantId);

    if (!leave) {
        throw new Error("LEAVE_NOT_FOUND");
    }

    if (leave.status !== "pending") {
        throw new Error("ONLY_PENDING_LEAVE_CAN_BE_DELETED");
    }

    const deletedLeave = await deleteLeave(leaveId, tenantId);

    if (!deletedLeave) {
        throw new Error("LEAVE_NOT_FOUND");
    }

    return deletedLeave;
}
