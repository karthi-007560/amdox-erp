
import mongoose from "mongoose";

import type {
    ISalaryComponent,
    IPayroll,
} from "../../models/hr/Payroll.js";

import type { IPayslip } from "../../models/hr/Payslip.js";

import {
    getEmployeeByIdAndTenant,
    getEmployeeByUserIdAndTenant,
} from "../../repositories/hr/employeeRepository.js";

import {
    getAttendanceByEmployeeAndDateRange,
} from "../../repositories/hr/attendanceRepository.js";

import {
    getLeaveByEmployeeAndDateRange,
} from "../../repositories/hr/leaveRepository.js";

import {
    createPayroll,
    getPayrollByEmployeeAndPeriod,
    getPayrollById,
    getPayrollsByTenant,
    getPayrollsByEmployee,
    createPayslip,
    getPayslipById,
    getPayslipByPayrollId,
    getPayslipsByTenant,
    getPublishedPayslipsByEmployee,
    getPayslipsByEmployee,
    updatePayslip,
} from "../../repositories/hr/payrollRepository.js";

interface PayrollCalculationInput {
    baseSalary: number;
    allowances: ISalaryComponent[];
    deductions: ISalaryComponent[];
    workingDays: number;
    presentDays: number;
    halfDays: number;
    unpaidLeaveDays: number;
    overtimeHours: number;
    overtimeRatePerHour: number;
}

interface PayrollCalculationResult {
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
}

const roundMoney = (amount: number): number =>
    Math.round((amount + Number.EPSILON) * 100) / 100;

function calculateComponentTotal(
    components: ISalaryComponent[],
    field: string
): number {
    if (!Array.isArray(components)) {
        throw new Error(`INVALID_${field.toUpperCase()}`);
    }

    return components.reduce((total, component) => {
        if (
            !component ||
            typeof component.name !== "string" ||
            !component.name.trim() ||
            !Number.isFinite(component.amount) ||
            component.amount < 0
        ) {
            throw new Error(`INVALID_${field.toUpperCase()}`);
        }

        return total + component.amount;
    }, 0);
}

function calculatePayroll(
    input: PayrollCalculationInput
): PayrollCalculationResult {
    const {
        baseSalary,
        allowances,
        deductions,
        workingDays,
        presentDays,
        halfDays,
        unpaidLeaveDays,
        overtimeHours,
        overtimeRatePerHour,
    } = input;

    const values: Record<string, number> = {
        baseSalary,
        workingDays,
        presentDays,
        halfDays,
        unpaidLeaveDays,
        overtimeHours,
        overtimeRatePerHour,
    };

    for (const [field, value] of Object.entries(values)) {
        if (!Number.isFinite(value) || value < 0) {
            throw new Error(`INVALID_${field.toUpperCase()}`);
        }
    }

    if (workingDays === 0) {
        throw new Error("INVALID_WORKING_DAYS");
    }

    if (presentDays + halfDays + unpaidLeaveDays > workingDays) {
        throw new Error("INVALID_ATTENDANCE_TOTAL");
    }

    const totalAllowances = calculateComponentTotal(
        allowances,
        "allowances"
    );

    const configuredDeductions = calculateComponentTotal(
        deductions,
        "deductions"
    );

    const overtimePay = roundMoney(
        overtimeHours * overtimeRatePerHour
    );

    const grossSalary = roundMoney(
        baseSalary + totalAllowances + overtimePay
    );

    const dailySalary =
        (baseSalary + totalAllowances) / workingDays;

    const unpaidLeaveEquivalent =
        unpaidLeaveDays + halfDays * 0.5;

    const unpaidLeaveDeduction = roundMoney(
        dailySalary * unpaidLeaveEquivalent
    );

    const totalDeductions = roundMoney(
        configuredDeductions + unpaidLeaveDeduction
    );

    const netSalary = roundMoney(
        grossSalary - totalDeductions
    );

    if (netSalary < 0) {
        throw new Error("DEDUCTIONS_EXCEED_GROSS_SALARY");
    }

    return {
        baseSalary,
        allowances,
        deductions,
        workingDays,
        presentDays,
        halfDays,
        unpaidLeaveDays,
        overtimeHours,
        overtimePay,
        unpaidLeaveDeduction,
        grossSalary,
        totalDeductions,
        netSalary,
    };
}

interface ProcessPayrollInput {
    employeeId: string;
    tenantId: string;
    processedBy: string;
    periodStart: string;
    periodEnd: string;
}

function normalizePayrollDate(date: string): Date {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error("INVALID_PAYROLL_DATE");
    }

    const normalizedDate = new Date(`${date}T00:00:00.000Z`);

    if (
        Number.isNaN(normalizedDate.getTime()) ||
        normalizedDate.toISOString().slice(0, 10) !== date
    ) {
        throw new Error("INVALID_PAYROLL_DATE");
    }

    return normalizedDate;
}

function validatePayrollPeriod(
    periodStart: Date,
    periodEnd: Date
): void {
    const year = periodStart.getUTCFullYear();
    const month = periodStart.getUTCMonth();

    const lastDay = new Date(
        Date.UTC(year, month + 1, 0)
    ).getUTCDate();

    if (
        periodStart.getUTCDate() !== 1 ||
        periodEnd.getUTCFullYear() !== year ||
        periodEnd.getUTCMonth() !== month ||
        periodEnd.getUTCDate() !== lastDay
    ) {
        throw new Error(
            "PAYROLL_PERIOD_MUST_BE_FULL_CALENDAR_MONTH"
        );
    }
}

function getDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function isWorkingDay(date: Date): boolean {
    const day = date.getUTCDay();

    return day >= 1 && day <= 5;
}

function calculateWorkingDays(
    periodStart: Date,
    periodEnd: Date
): number {
    let workingDays = 0;

    const currentDate = new Date(periodStart);

    while (currentDate <= periodEnd) {
        if (isWorkingDay(currentDate)) {
            workingDays++;
        }

        currentDate.setUTCDate(
            currentDate.getUTCDate() + 1
        );
    }

    return workingDays;
}

function isLeaveOnDate(
    leave: {
        startDate: Date;
        endDate: Date;
    },
    date: Date
): boolean {
    const currentDate = getDateKey(date);

    return (
        currentDate >= getDateKey(leave.startDate) &&
        currentDate <= getDateKey(leave.endDate)
    );
}

function calculateAttendanceSummary(
    periodStart: Date,
    periodEnd: Date,
    attendanceRecords: {
        date: Date;
        status: string;
    }[],
    approvedLeaves: {
        startDate: Date;
        endDate: Date;
        leaveType: string;
    }[]
) {
    const attendanceMap = new Map(
        attendanceRecords.map((record) => [
            getDateKey(record.date),
            record,
        ])
    );

    let presentDays = 0;
    let halfDays = 0;
    let unpaidLeaveDays = 0;

    const currentDate = new Date(periodStart);

    while (currentDate <= periodEnd) {
        if (!isWorkingDay(currentDate)) {
            currentDate.setUTCDate(
                currentDate.getUTCDate() + 1
            );
            continue;
        }

        const dateKey = getDateKey(currentDate);
        const attendance = attendanceMap.get(dateKey);

        const approvedLeave = approvedLeaves.find((leave) =>
            isLeaveOnDate(leave, currentDate)
        );

        if (!attendance && !approvedLeave) {
            throw new Error(
                `ATTENDANCE_INCOMPLETE_FOR_DATE_${dateKey}`
            );
        }

        if (attendance?.status === "present") {
            presentDays++;
        } else if (attendance?.status === "half-day") {
            halfDays++;
        } else if (attendance?.status === "absent") {
            if (
                approvedLeave?.leaveType === "unpaid" ||
                !approvedLeave
            ) {
                unpaidLeaveDays++;
            }
        } else if (attendance?.status === "on-leave") {
            if (!approvedLeave) {
                throw new Error(
                    `UNAPPROVED_ON_LEAVE_ATTENDANCE_${dateKey}`
                );
            }

            if (approvedLeave.leaveType === "unpaid") {
                unpaidLeaveDays++;
            }
        } else if (!attendance && approvedLeave) {
            if (approvedLeave.leaveType === "unpaid") {
                unpaidLeaveDays++;
            }
        } else {
            throw new Error(
                `INVALID_ATTENDANCE_STATUS_${dateKey}`
            );
        }

        currentDate.setUTCDate(
            currentDate.getUTCDate() + 1
        );
    }

    return {
        presentDays,
        halfDays,
        unpaidLeaveDays,
    };
}

export async function processPayrollService(
    input: ProcessPayrollInput
) {
    const {
        employeeId,
        tenantId,
        processedBy,
        periodStart: periodStartInput,
        periodEnd: periodEndInput,
    } = input;

    if (
        !mongoose.isValidObjectId(employeeId) ||
        !mongoose.isValidObjectId(tenantId) ||
        !mongoose.isValidObjectId(processedBy)
    ) {
        throw new Error(
            "INVALID_EMPLOYEE_TENANT_OR_USER_ID"
        );
    }

    const periodStart = normalizePayrollDate(
        periodStartInput
    );

    const periodEnd = normalizePayrollDate(
        periodEndInput
    );

    validatePayrollPeriod(periodStart, periodEnd);

    const existingPayroll = await getPayrollByEmployeeAndPeriod(
        employeeId,
        tenantId,
        periodStart,
        periodEnd
    );

    if (existingPayroll) {
        throw new Error("PAYROLL_ALREADY_EXISTS");
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

    if (
        employee.dateOfJoining &&
        getDateKey(employee.dateOfJoining) >
            getDateKey(periodStart)
    ) {
        throw new Error(
            "EMPLOYEE_JOINED_DURING_OR_AFTER_PAYROLL_PERIOD_NOT_SUPPORTED"
        );
    }

    const compensation = employee.compensation;

    if (!compensation) {
        throw new Error(
            "EMPLOYEE_COMPENSATION_NOT_CONFIGURED"
        );
    }

    if (
        compensation.effectiveFrom &&
        getDateKey(compensation.effectiveFrom) >
            getDateKey(periodStart)
    ) {
        throw new Error(
            "COMPENSATION_NOT_EFFECTIVE_AT_PERIOD_START"
        );
    }

    const workingDays = calculateWorkingDays(
        periodStart,
        periodEnd
    );

    if (workingDays === 0) {
        throw new Error("INVALID_WORKING_DAYS");
    }

    const [
        attendanceRecords,
        leaveRecords,
    ] = await Promise.all([
        getAttendanceByEmployeeAndDateRange(
            employeeId,
            tenantId,
            periodStart,
            periodEnd
        ),

        getLeaveByEmployeeAndDateRange(
            employeeId,
            tenantId,
            periodStart,
            periodEnd
        ),
    ]);

    const approvedLeaves = leaveRecords.filter(
        (leave) => leave.status === "approved"
    );

    const attendanceSummary = calculateAttendanceSummary(
        periodStart,
        periodEnd,
        attendanceRecords,
        approvedLeaves
    );

    const allowances: ISalaryComponent[] =
        compensation.allowances.map(
            (item: { name: string; amount: number }) => ({
                name: item.name,
                amount: item.amount,
            })
        );

    const deductions: ISalaryComponent[] =
        compensation.deductions.map(
            (item: { name: string; amount: number }) => ({
                name: item.name,
                amount: item.amount,
            })
        );

    const overtimeHours = 0;
    const overtimeRatePerHour = 0;

    const calculation = calculatePayroll({
        baseSalary: compensation.baseSalary,
        allowances,
        deductions,
        workingDays,
        presentDays: attendanceSummary.presentDays,
        halfDays: attendanceSummary.halfDays,
        unpaidLeaveDays: attendanceSummary.unpaidLeaveDays,
        overtimeHours,
        overtimeRatePerHour,
    });

    const payrollData: Partial<IPayroll> = {
        employeeId: new mongoose.Types.ObjectId(employeeId),
        tenantId: new mongoose.Types.ObjectId(tenantId),

        periodStart,
        periodEnd,

        currency: compensation.currency,
        baseSalary: calculation.baseSalary,

        allowances: calculation.allowances,
        deductions: calculation.deductions,

        workingDays: calculation.workingDays,
        presentDays: calculation.presentDays,
        halfDays: calculation.halfDays,
        unpaidLeaveDays: calculation.unpaidLeaveDays,
        overtimeHours: calculation.overtimeHours,

        overtimePay: calculation.overtimePay,
        unpaidLeaveDeduction: calculation.unpaidLeaveDeduction,

        grossSalary: calculation.grossSalary,
        totalDeductions: calculation.totalDeductions,
        netSalary: calculation.netSalary,

        status: "processed",

        processedBy: new mongoose.Types.ObjectId(processedBy),
        processedAt: new Date(),
    };

    try {
        return await createPayroll(payrollData);
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000
        ) {
            throw new Error("PAYROLL_ALREADY_EXISTS");
        }

        throw error;
    }
}

export async function getPayrollByIdService(
    payrollId: string,
    tenantId: string
) {
    if (
        !mongoose.isValidObjectId(payrollId) ||
        !mongoose.isValidObjectId(tenantId)
    ) {
        throw new Error("INVALID_PAYROLL_OR_TENANT_ID");
    }

    const payroll = await getPayrollById(payrollId, tenantId);

    if (!payroll) {
        throw new Error("PAYROLL_NOT_FOUND");
    }

    return payroll;
}

export async function getPayrollsByTenantService(
    tenantId: string
) {
    if (!mongoose.isValidObjectId(tenantId)) {
        throw new Error("INVALID_TENANT_ID");
    }

    return getPayrollsByTenant(tenantId);
}

export async function getPayrollsByEmployeeService(
    employeeId: string,
    tenantId: string
) {
    if (
        !mongoose.isValidObjectId(employeeId) ||
        !mongoose.isValidObjectId(tenantId)
    ) {
        throw new Error("INVALID_EMPLOYEE_OR_TENANT_ID");
    }

    return getPayrollsByEmployee(employeeId, tenantId);
}

interface GeneratePayslipInput {
    payrollId: string;
    tenantId: string;
    generatedBy: string;
}

function validatePayslipObjectIds(
    ...ids: string[]
): void {
    const areValid = ids.every((id) =>
        mongoose.isValidObjectId(id)
    );

    if (!areValid) {
        throw new Error("INVALID_MONGODB_ID");
    }
}

export async function generatePayslipService(
    input: GeneratePayslipInput
) {
    const {
        payrollId,
        tenantId,
        generatedBy,
    } = input;

    validatePayslipObjectIds(
        payrollId,
        tenantId,
        generatedBy
    );

    const payroll = await getPayrollById(
        payrollId,
        tenantId
    );

    if (!payroll) {
        throw new Error("PAYROLL_NOT_FOUND");
    }

    if (
        payroll.status !== "processed" &&
        payroll.status !== "paid"
    ) {
        throw new Error(
            "PAYROLL_MUST_BE_PROCESSED_BEFORE_GENERATING_PAYSLIP"
        );
    }

    const existingPayslip = await getPayslipByPayrollId(
        payrollId,
        tenantId
    );

    if (existingPayslip) {
        throw new Error("PAYSLIP_ALREADY_EXISTS");
    }

    const employeeReference = payroll.employeeId as unknown as {
        _id?: mongoose.Types.ObjectId;
    };

    const employeeId = new mongoose.Types.ObjectId(
        String(employeeReference._id ?? payroll.employeeId)
    );

    const payslipNumber = `PS-${payrollId.toUpperCase()}`;

    const payslipData: Partial<IPayslip> = {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        employeeId,
        payrollId: new mongoose.Types.ObjectId(payrollId),
        payslipNumber,
        issueDate: new Date(),
        status: "generated",
        generatedBy: new mongoose.Types.ObjectId(generatedBy),
    };

    try {
        return await createPayslip(payslipData);
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000
        ) {
            throw new Error("PAYSLIP_ALREADY_EXISTS");
        }

        throw error;
    }
}

export async function getPayslipByIdService(
    payslipId: string,
    tenantId: string
) {
    validatePayslipObjectIds(payslipId, tenantId);

    const payslip = await getPayslipById(
        payslipId,
        tenantId
    );

    if (!payslip) {
        throw new Error("PAYSLIP_NOT_FOUND");
    }

    return payslip;
}

export async function getPayslipsByEmployeeService(
    employeeId: string,
    tenantId: string
) {
    validatePayslipObjectIds(employeeId, tenantId);

    return getPayslipsByEmployee(
        employeeId,
        tenantId
    );
}

export async function getMyPayslipsService(
    userId: string,
    tenantId: string
) {
    validatePayslipObjectIds(userId, tenantId);

    const employee = await getEmployeeByUserIdAndTenant(
        userId,
        tenantId
    );

    if (!employee) {
        throw new Error("EMPLOYEE_PROFILE_NOT_FOUND");
    }

    return getPublishedPayslipsByEmployee(
        employee._id.toString(),
        tenantId
    );
}

export async function getPayslipsByTenantService(
    tenantId: string
) {
    validatePayslipObjectIds(tenantId);

    return getPayslipsByTenant(tenantId);
}

export async function publishPayslipService(
    payslipId: string,
    tenantId: string
) {
    validatePayslipObjectIds(payslipId, tenantId);

    const payslip = await getPayslipById(
        payslipId,
        tenantId
    );

    if (!payslip) {
        throw new Error("PAYSLIP_NOT_FOUND");
    }

    if (payslip.status === "published") {
        throw new Error("PAYSLIP_ALREADY_PUBLISHED");
    }

    if (payslip.status !== "generated") {
        throw new Error("INVALID_PAYSLIP_STATUS");
    }

    const updatedPayslip = await updatePayslip(
        payslipId,
        tenantId,
        {
            status: "published",
            publishedAt: new Date(),
        }
    );

    if (!updatedPayslip) {
        throw new Error("PAYSLIP_UPDATE_FAILED");
    }

    return updatedPayslip;
}
