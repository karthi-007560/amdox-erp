import type { Request, Response, NextFunction } from "express";


import {
    createLeaveService,
    getLeaveByIdService,
    getLeavesByTenantService,
    getLeavesByEmployeeService,
    approveLeaveService,
    rejectLeaveService,
    deleteLeaveService,
} from "../../services/hr/leaveService.js";

import type { LeaveType } from "../../models/hr/Leave.js";

function isValidLeaveType(value: string): value is LeaveType {
    return [
        "casual",
        "sick",
        "earned",
        "unpaid",
        "other",
    ].includes(value);
}

function getErrorStatus(error: unknown): number {
    const message = error instanceof Error ? error.message : "";

    if (message.startsWith("INVALID_")) {
        return 400;
    }

    switch (message) {
        case "END_DATE_BEFORE_START_DATE":
        case "EMPLOYEE_IS_NOT_ACTIVE":
        case "REJECTION_REASON_REQUIRED":
            return 400;

        case "EMPLOYEE_NOT_FOUND_IN_TENANT":
        case "LEAVE_NOT_FOUND":
            return 404;

        case "LEAVE_DATE_OVERLAP":
        case "LEAVE_IS_NOT_PENDING":
        case "ONLY_PENDING_LEAVE_CAN_BE_DELETED":
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

function getLeaveId(req: Request): string | undefined {
    const leaveId = req.params.leaveId;

    return typeof leaveId === "string" && leaveId.trim()
        ? leaveId.trim()
        : undefined;
}

function getEmployeeId(req: Request): string | undefined {
    const employeeId = req.params.employeeId;

    return typeof employeeId === "string" && employeeId.trim()
        ? employeeId.trim()
        : undefined;
}


export async function createLeaveController(
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

        const {
            employeeId,
            leaveType,
            startDate,
            endDate,
            reason,
        } = req.body;

        if (
            typeof employeeId !== "string" ||
            typeof leaveType !== "string" ||
            !isValidLeaveType(leaveType) ||
            typeof startDate !== "string" ||
            typeof endDate !== "string" ||
            typeof reason !== "string"
        ) {
            res.status(400).json({
                success: false,
                message: "REQUIRED_LEAVE_FIELDS_MISSING",
            });
            return;
        }

        const leave = await createLeaveService({
            employeeId,
            tenantId,
            leaveType,
            startDate,
            endDate,
            reason,
        });

        res.status(201).json({
            success: true,
            message: "Leave request created successfully",
            data: leave,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}


export async function getLeavesController(
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

        const leaves = await getLeavesByTenantService(tenantId);

        res.status(200).json({
            success: true,
            count: leaves.length,
            data: leaves,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}


export async function getEmployeeLeavesController(
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

        const leaves = await getLeavesByEmployeeService(
            employeeId,
            tenantId
        );

        res.status(200).json({
            success: true,
            count: leaves.length,
            data: leaves,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getLeaveController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const leaveId = getLeaveId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!leaveId) {
            res.status(400).json({
                success: false,
                message: "LEAVE_ID_REQUIRED",
            });
            return;
        }

        const leave = await getLeaveByIdService(
            leaveId,
            tenantId
        );

        res.status(200).json({
            success: true,
            data: leave,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function approveLeaveController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const leaveId = getLeaveId(req);
        const reviewerId = req.auth?.userId;

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!leaveId || !reviewerId) {
            res.status(400).json({
                success: false,
                message: "LEAVE_ID_OR_REVIEWER_ID_REQUIRED",
            });
            return;
        }

        const leave = await approveLeaveService(
            leaveId,
            tenantId,
            reviewerId
        );

        res.status(200).json({
            success: true,
            message: "Leave approved successfully",
            data: leave,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function rejectLeaveController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const leaveId = getLeaveId(req);
        const reviewerId = req.auth?.userId;
        const { rejectionReason } = req.body;

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!leaveId || !reviewerId) {
            res.status(400).json({
                success: false,
                message: "LEAVE_ID_OR_REVIEWER_ID_REQUIRED",
            });
            return;
        }

        if (
            typeof rejectionReason !== "string" ||
            !rejectionReason.trim()
        ) {
            res.status(400).json({
                success: false,
                message: "REJECTION_REASON_REQUIRED",
            });
            return;
        }

        const leave = await rejectLeaveService(
            leaveId,
            tenantId,
            reviewerId,
            rejectionReason
        );

        res.status(200).json({
            success: true,
            message: "Leave rejected successfully",
            data: leave,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function deleteLeaveController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const leaveId = getLeaveId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!leaveId) {
            res.status(400).json({
                success: false,
                message: "LEAVE_ID_REQUIRED",
            });
            return;
        }

        await deleteLeaveService(leaveId, tenantId);

        res.status(200).json({
            success: true,
            message: "Leave request deleted successfully",
        });
    } catch (error) {
        sendError(error, res, next);
    }
}
