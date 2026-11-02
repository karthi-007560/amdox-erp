
import mongoose from "mongoose";

import type {
    EmployeeStatus,
    IEmployeeCompensation,
} from "../../models/hr/Employee.js";

import Employee from "../../models/hr/Employee.js";
import { User } from "../../models/User.js";

import {
    createEmployee,
    getEmployeeByUserId,
    getEmployeesByTenant,
} from "../../repositories/hr/employeeRepository.js";

interface CreateEmployeeInput {
    userId: string;
    tenantId: string;
    employeeId: string;
    department?: string;
    designation?: string;
    phone?: string;
    dateOfJoining?: Date;
    status?: EmployeeStatus;
    compensation?: IEmployeeCompensation;
}

interface UpdateEmployeeInput {
    employeeId?: string;
    department?: string;
    designation?: string;
    phone?: string;
    dateOfJoining?: Date;
    status?: EmployeeStatus;
    compensation?: IEmployeeCompensation;
}

function validateObjectId(
    id: string,
    fieldName: string
): void {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error(`INVALID_${fieldName.toUpperCase()}`);
    }
}

export async function createEmployeeService(
    input: CreateEmployeeInput
) {
    validateObjectId(input.userId, "userId");
    validateObjectId(input.tenantId, "tenantId");

    if (!input.employeeId?.trim()) {
        throw new Error("EMPLOYEE_ID_REQUIRED");
    }

    const tenantObjectId = new mongoose.Types.ObjectId(
        input.tenantId
    );

    const userObjectId = new mongoose.Types.ObjectId(
        input.userId
    );

    const user = await User.findById(userObjectId).select(
        "_id tenantId isActive"
    );

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    if (!user.isActive) {
        throw new Error("USER_NOT_ACTIVE");
    }

    if (
        !user.tenantId ||
        !user.tenantId.equals(tenantObjectId)
    ) {
        throw new Error("USER_NOT_ASSIGNED_TO_TENANT");
    }

    const existingEmployee = await getEmployeeByUserId(
        input.userId
    );

    if (existingEmployee) {
        throw new Error("EMPLOYEE_ALREADY_EXISTS_FOR_USER");
    }

    return createEmployee({
        userId: userObjectId,
        tenantId: tenantObjectId,
        employeeId: input.employeeId.trim(),
        department: input.department?.trim(),
        designation: input.designation?.trim(),
        phone: input.phone?.trim(),
        dateOfJoining: input.dateOfJoining,
        status: input.status ?? "active",
        compensation: input.compensation,
    });
}

export async function getEmployeeService(
    employeeId: string,
    tenantId: string
) {
    validateObjectId(employeeId, "employeeId");
    validateObjectId(tenantId, "tenantId");

    const employee = await Employee.findOne({
        _id: employeeId,
        tenantId,
    })
        .populate("userId", "name email role")
        .populate("tenantId", "name code");

    if (!employee) {
        throw new Error("EMPLOYEE_NOT_FOUND");
    }

    return employee;
}

export async function getEmployeesByTenantService(
    tenantId: string
) {
    validateObjectId(tenantId, "tenantId");

    return getEmployeesByTenant(tenantId);
}

export async function updateEmployeeService(
    employeeId: string,
    tenantId: string,
    input: UpdateEmployeeInput
) {
    validateObjectId(employeeId, "employeeId");
    validateObjectId(tenantId, "tenantId");

    const updateData: Record<string, unknown> = {};

    if (input.employeeId !== undefined) {
        if (!input.employeeId.trim()) {
            throw new Error("EMPLOYEE_ID_REQUIRED");
        }

        updateData.employeeId = input.employeeId.trim();
    }

    if (input.department !== undefined) {
        updateData.department = input.department.trim();
    }

    if (input.designation !== undefined) {
        updateData.designation = input.designation.trim();
    }

    if (input.phone !== undefined) {
        updateData.phone = input.phone.trim();
    }

    if (input.dateOfJoining !== undefined) {
        updateData.dateOfJoining = input.dateOfJoining;
    }

    if (input.status !== undefined) {
        updateData.status = input.status;
    }

    if (input.compensation !== undefined) {
        updateData.compensation = input.compensation;
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error("NO_EMPLOYEE_FIELDS_TO_UPDATE");
    }

    const employee = await Employee.findOneAndUpdate(
        {
            _id: employeeId,
            tenantId,
        },
        {
            $set: updateData,
        },
        {
            new: true,
            runValidators: true,
        }
    )
        .populate("userId", "name email role")
        .populate("tenantId", "name code");

    if (!employee) {
        throw new Error("EMPLOYEE_NOT_FOUND");
    }

    return employee;
}

export async function deleteEmployeeService(
    employeeId: string,
    tenantId: string
) {
    validateObjectId(employeeId, "employeeId");
    validateObjectId(tenantId, "tenantId");

    const employee = await Employee.findOneAndDelete({
        _id: employeeId,
        tenantId,
    });

    if (!employee) {
        throw new Error("EMPLOYEE_NOT_FOUND");
    }

    return employee;
}
