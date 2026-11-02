import type { Request, Response, NextFunction } from "express";

import {
    createAttendanceService,
    getAttendanceByIdService,
    getAttendancesByTenantService,
    updateAttendanceService,
    deleteAttendanceService,
} from "../../services/hr/attendanceService.js";

function getErrorStatus(error: unknown): number {
    const message = error instanceof Error ? error.message : "";

    if (message.startsWith("INVALID_")) {
        return 400;
    }

    switch (message) {
        case "CHECK_OUT_MUST_BE_AFTER_CHECK_IN":
        case "EMPLOYEE_IS_NOT_ACTIVE":
            return 400;

        case "EMPLOYEE_NOT_FOUND_IN_TENANT":
        case "ATTENDANCE_NOT_FOUND":
            return 404;

        case "ATTENDANCE_ALREADY_EXISTS":
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

function getAttendanceId(req: Request): string | undefined {
    const attendanceId = req.params.attendanceId;

    return typeof attendanceId === "string" && attendanceId.trim()
        ? attendanceId.trim()
        : undefined;
}

function parseOptionalDateTime(
    value: unknown,
    fieldName: string
): Date | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value !== "string" || !value.trim()) {
        throw new Error(`INVALID_${fieldName}`);
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
        throw new Error(`INVALID_${fieldName}`);
    }

    return parsedDate;
}

export async function createAttendanceController(
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
            date,
            checkIn,
            checkOut,
            status,
            remarks,
        } = req.body;

        if (
            typeof employeeId !== "string" ||
            typeof date !== "string"
        ) {
            res.status(400).json({
                success: false,
                message: "EMPLOYEE_ID_AND_DATE_REQUIRED",
            });
            return;
        }

        if (remarks !== undefined && typeof remarks !== "string") {
            res.status(400).json({
                success: false,
                message: "INVALID_REMARKS",
            });
            return;
        }

        const attendance = await createAttendanceService({
            employeeId,
            tenantId,
            date,
            checkIn: parseOptionalDateTime(checkIn, "CHECK_IN_TIME"),
            checkOut: parseOptionalDateTime(checkOut, "CHECK_OUT_TIME"),
            status,
            remarks,
        });

        res.status(201).json({
            success: true,
            message: "Attendance created successfully",
            data: attendance,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getAttendancesController(
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

        const attendances =
            await getAttendancesByTenantService(tenantId);

        res.status(200).json({
            success: true,
            count: attendances.length,
            data: attendances,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getAttendanceController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const attendanceId = getAttendanceId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!attendanceId) {
            res.status(400).json({
                success: false,
                message: "ATTENDANCE_ID_REQUIRED",
            });
            return;
        }

        const attendance = await getAttendanceByIdService(
            attendanceId,
            tenantId
        );

        res.status(200).json({
            success: true,
            data: attendance,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function updateAttendanceController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const attendanceId = getAttendanceId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!attendanceId) {
            res.status(400).json({
                success: false,
                message: "ATTENDANCE_ID_REQUIRED",
            });
            return;
        }

        const { date, checkIn, checkOut, status, remarks } = req.body;

        if (date !== undefined && typeof date !== "string") {
            res.status(400).json({
                success: false,
                message: "INVALID_ATTENDANCE_DATE",
            });
            return;
        }

        if (remarks !== undefined && typeof remarks !== "string") {
            res.status(400).json({
                success: false,
                message: "INVALID_REMARKS",
            });
            return;
        }

        const attendance = await updateAttendanceService(
            attendanceId,
            tenantId,
            {
                date,
                checkIn: parseOptionalDateTime(checkIn, "CHECK_IN_TIME"),
                checkOut: parseOptionalDateTime(checkOut, "CHECK_OUT_TIME"),
                status,
                remarks,
            }
        );

        res.status(200).json({
            success: true,
            message: "Attendance updated successfully",
            data: attendance,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function deleteAttendanceController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const attendanceId = getAttendanceId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!attendanceId) {
            res.status(400).json({
                success: false,
                message: "ATTENDANCE_ID_REQUIRED",
            });
            return;
        }

        await deleteAttendanceService(attendanceId, tenantId);

        res.status(200).json({
            success: true,
            message: "Attendance deleted successfully",
        });
    } catch (error) {
        sendError(error, res, next);
    }
}