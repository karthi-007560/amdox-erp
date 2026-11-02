
import Payroll from "../../models/hr/Payroll.js";
import type { IPayroll } from "../../models/hr/Payroll.js";

import Payslip from "../../models/hr/Payslip.js";
import type { IPayslip } from "../../models/hr/Payslip.js";

export async function createPayroll(
    payrollData: Partial<IPayroll>
) {
    return Payroll.create(payrollData);
}

export async function getPayrollById(
    payrollId: string,
    tenantId: string
) {
    return Payroll.findOne({
        _id: payrollId,
        tenantId,
    })
        .populate("employeeId")
        .populate("tenantId", "name code")
        .populate("processedBy", "name email");
}

export async function getPayrollByEmployeeAndPeriod(
    employeeId: string,
    tenantId: string,
    periodStart: Date,
    periodEnd: Date
) {
    return Payroll.findOne({
        employeeId,
        tenantId,
        periodStart,
        periodEnd,
    });
}

export async function getPayrollsByTenant(
    tenantId: string
) {
    return Payroll.find({ tenantId })
        .populate("employeeId")
        .sort({ periodStart: -1, createdAt: -1 });
}

export async function getPayrollsByEmployee(
    employeeId: string,
    tenantId: string
) {
    return Payroll.find({
        employeeId,
        tenantId,
    }).sort({ periodStart: -1 });
}

export async function updatePayroll(
    payrollId: string,
    tenantId: string,
    updateData: Partial<IPayroll>
) {
    return Payroll.findOneAndUpdate(
        {
            _id: payrollId,
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
        .populate("employeeId")
        .populate("processedBy", "name email");
}

export async function deletePayroll(
    payrollId: string,
    tenantId: string
) {
    return Payroll.findOneAndDelete({
        _id: payrollId,
        tenantId,
    });
}


export async function createPayslip(
    payslipData: Partial<IPayslip>
) {
    return Payslip.create(payslipData);
}

export async function getPayslipById(
    payslipId: string,
    tenantId: string
) {
    return Payslip.findOne({
        _id: payslipId,
        tenantId,
    })
        .populate("employeeId")
        .populate("payrollId")
        .populate("tenantId", "name code")
        .populate("generatedBy", "name email");
}

export async function getPayslipByPayrollId(
    payrollId: string,
    tenantId: string
) {
    return Payslip.findOne({
        payrollId,
        tenantId,
    })
        .populate("employeeId")
        .populate("payrollId");
}

export async function getPayslipsByTenant(
    tenantId: string
) {
    return Payslip.find({ tenantId })
        .populate("employeeId")
        .populate("payrollId")
        .sort({ issueDate: -1 });
}

export async function getPayslipsByEmployee(
    employeeId: string,
    tenantId: string
) {
    return Payslip.find({
        employeeId,
        tenantId,
    })
        .populate("payrollId")
        .sort({ issueDate: -1 });
}

export async function getPublishedPayslipsByEmployee(
    employeeId: string,
    tenantId: string
) {
    return Payslip.find({
        employeeId,
        tenantId,
        status: "published",
    })
        .populate("payrollId")
        .sort({ issueDate: -1 });
}

export async function updatePayslip(
    payslipId: string,
    tenantId: string,
    updateData: Partial<IPayslip>
) {
    return Payslip.findOneAndUpdate(
        {
            _id: payslipId,
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
        .populate("employeeId")
        .populate("payrollId");
}
