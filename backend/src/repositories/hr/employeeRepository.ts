
import Employee from "../../models/hr/Employee.js";
import type { IEmployee } from "../../models/hr/Employee.js";

export async function createEmployee(
    employeeData: Partial<IEmployee>
) {
    return Employee.create(employeeData);
}

export async function getEmployeeByUserId(userId: string) {
    return Employee.findOne({ userId })
        .populate("userId", "name email role")
        .populate("tenantId", "name code");
}

export async function getEmployeeByUserIdAndTenant(
    userId: string,
    tenantId: string
) {
    return Employee.findOne({
        userId,
        tenantId,
    });
}

export async function getEmployeesByTenant(tenantId: string) {
    return Employee.find({ tenantId })
        .populate("userId", "name email role")
        .sort({ createdAt: -1 });
}

export async function getEmployeeById(employeeId: string) {
    return Employee.findById(employeeId)
        .populate("userId", "name email role")
        .populate("tenantId", "name code");
}

export async function updateEmployeeById(
    employeeId: string,
    updateData: Partial<IEmployee>
) {
    return Employee.findByIdAndUpdate(
        employeeId,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );
}

export async function deleteEmployeeById(employeeId: string) {
    return Employee.findByIdAndDelete(employeeId);
}

export async function getEmployeeByIdAndTenant(
    employeeId: string,
    tenantId: string
) {
    return Employee.findOne({
        _id: employeeId,
        tenantId,
    });
}
