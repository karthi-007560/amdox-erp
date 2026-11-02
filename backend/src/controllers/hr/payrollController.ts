
import type { Request, Response, NextFunction } from "express";

import {
    processPayrollService,
    getPayrollByIdService,
    getPayrollsByTenantService,
    getPayrollsByEmployeeService,
    generatePayslipService,
    getPayslipByIdService,
    getPayslipsByTenantService,
    getPayslipsByEmployeeService,
    getMyPayslipsService,
    publishPayslipService,
} from "../../services/hr/payrollEngine.js";

function getErrorStatus(error: unknown): number {
    const message = error instanceof Error ? error.message : "";

    if (message.startsWith("INVALID_")) {
        return 400;
    }

    if (
        message.startsWith("ATTENDANCE_INCOMPLETE_") ||
        message.startsWith("UNAPPROVED_ON_LEAVE_ATTENDANCE_")
    ) {
        return 409;
    }

    switch (message) {
        case "PAYROLL_PERIOD_MUST_BE_FULL_CALENDAR_MONTH":
        case "EMPLOYEE_IS_NOT_ACTIVE":
        case "EMPLOYEE_JOINED_DURING_OR_AFTER_PAYROLL_PERIOD_NOT_SUPPORTED":
        case "EMPLOYEE_COMPENSATION_NOT_CONFIGURED":
        case "COMPENSATION_NOT_EFFECTIVE_AT_PERIOD_START":
        case "INVALID_WORKING_DAYS":
        case "DEDUCTIONS_EXCEED_GROSS_SALARY":
        case "PAYROLL_MUST_BE_PROCESSED_BEFORE_GENERATING_PAYSLIP":
            return 400;

        case "EMPLOYEE_NOT_FOUND_IN_TENANT":
        case "PAYROLL_NOT_FOUND":
        case "PAYSLIP_NOT_FOUND":
        case "EMPLOYEE_PROFILE_NOT_FOUND":
            return 404;

        case "PAYROLL_ALREADY_EXISTS":
        case "PAYSLIP_ALREADY_EXISTS":
        case "PAYSLIP_ALREADY_PUBLISHED":
        case "INVALID_PAYSLIP_STATUS":
            return 409;

        default:
            return 500;
    }
}

function sendError(
    error: unknown,
    res: Response,
    next: NextFunction
): void {
    const status = getErrorStatus(error);

    if (status === 500) {
        next(error);
        return;
    }

    res.status(status).json({
        success: false,
        message: error instanceof Error
            ? error.message
            : "Request failed",
    });
}

function getTenantId(req: Request): string | undefined {
    return req.tenantId;
}

function getPayslipId(req: Request): string | undefined {
    const payslipId = req.params.payslipId;

    return typeof payslipId === "string" && payslipId.trim()
        ? payslipId.trim()
        : undefined;
}

function getEmployeeId(req: Request): string | undefined {
    const employeeId = req.params.employeeId;

    return typeof employeeId === "string" && employeeId.trim()
        ? employeeId.trim()
        : undefined;
}

// =====================================================
// PAYROLL CONTROLLERS
// =====================================================

export async function processPayrollController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = req.tenantId;
        const processedBy = req.auth?.userId;

        const {
            employeeId,
            periodStart,
            periodEnd,
        } = req.body;

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!processedBy) {
            res.status(401).json({
                success: false,
                message: "AUTHENTICATED_USER_REQUIRED",
            });
            return;
        }

        if (
            typeof employeeId !== "string" ||
            typeof periodStart !== "string" ||
            typeof periodEnd !== "string"
        ) {
            res.status(400).json({
                success: false,
                message: "REQUIRED_PAYROLL_FIELDS_MISSING",
            });
            return;
        }

        const payroll = await processPayrollService({
            employeeId,
            tenantId,
            processedBy,
            periodStart,
            periodEnd,
        });

        res.status(201).json({
            success: true,
            message: "Payroll processed successfully",
            data: payroll,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getPayrollsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = req.tenantId;

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        const payrolls = await getPayrollsByTenantService(tenantId);

        res.status(200).json({
            success: true,
            count: payrolls.length,
            data: payrolls,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getPayrollController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = req.tenantId;
        const payrollId = req.params.payrollId;

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (typeof payrollId !== "string") {
            res.status(400).json({
                success: false,
                message: "INVALID_PAYROLL_ID",
            });
            return;
        }

        const payroll = await getPayrollByIdService(
            payrollId,
            tenantId
        );

        res.status(200).json({
            success: true,
            data: payroll,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getEmployeePayrollsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = req.tenantId;
        const employeeId = req.params.employeeId;

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (typeof employeeId !== "string") {
            res.status(400).json({
                success: false,
                message: "INVALID_EMPLOYEE_ID",
            });
            return;
        }

        const payrolls = await getPayrollsByEmployeeService(
            employeeId,
            tenantId
        );

        res.status(200).json({
            success: true,
            count: payrolls.length,
            data: payrolls,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

// =====================================================
// PAYSLIP CONTROLLERS
// =====================================================

export async function generatePayslipController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const generatedBy = req.auth?.userId;
        const { payrollId } = req.body;

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (
            typeof payrollId !== "string" ||
            !payrollId.trim() ||
            !generatedBy
        ) {
            res.status(400).json({
                success: false,
                message: "PAYROLL_ID_OR_GENERATED_BY_REQUIRED",
            });
            return;
        }

        const payslip = await generatePayslipService({
            payrollId: payrollId.trim(),
            tenantId,
            generatedBy,
        });

        res.status(201).json({
            success: true,
            message: "Payslip generated successfully",
            data: payslip,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getPayslipsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        const payslips = await getPayslipsByTenantService(tenantId);

        res.status(200).json({
            success: true,
            count: payslips.length,
            data: payslips,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getEmployeePayslipsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const employeeId = getEmployeeId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!employeeId) {
            res.status(400).json({
                success: false,
                message: "EMPLOYEE_ID_REQUIRED",
            });
            return;
        }

        const payslips = await getPayslipsByEmployeeService(
            employeeId,
            tenantId
        );

        res.status(200).json({
            success: true,
            count: payslips.length,
            data: payslips,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getMyPayslipsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const userId = req.auth?.userId;

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "AUTHENTICATION_REQUIRED",
            });
            return;
        }

        const payslips = await getMyPayslipsService(
            userId,
            tenantId
        );

        res.status(200).json({
            success: true,
            count: payslips.length,
            data: payslips,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getPayslipController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const payslipId = getPayslipId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!payslipId) {
            res.status(400).json({
                success: false,
                message: "PAYSLIP_ID_REQUIRED",
            });
            return;
        }

        const payslip = await getPayslipByIdService(
            payslipId,
            tenantId
        );

        res.status(200).json({
            success: true,
            data: payslip,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function publishPayslipController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const payslipId = getPayslipId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!payslipId) {
            res.status(400).json({
                success: false,
                message: "PAYSLIP_ID_REQUIRED",
            });
            return;
        }

        const payslip = await publishPayslipService(
            payslipId,
            tenantId
        );

        res.status(200).json({
            success: true,
            message: "Payslip published successfully",
            data: payslip,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}
