import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

function isRequestBody(body: unknown): body is Record<string, unknown> {
    return (
        body !== null &&
        typeof body === "object" &&
        !Array.isArray(body)
    );
}

function isValidDate(value: unknown): boolean {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
}

function sendValidationError(
    res: Response,
    message: string
): void {
    res.status(400).json({
        success: false,
        message,
    });
}

const allowedEmployeeStatuses = [
    "active",
    "inactive",
    "on-leave",
];

const allowedEmployeeUpdateFields = [
    "employeeId",
    "department",
    "designation",
    "phone",
    "dateOfJoining",
    "status",
    "compensation",
];

function isOptionalString(value: unknown): boolean {
    return value === undefined || typeof value === "string";
}

function validateSalaryComponents(value: unknown): boolean {
    if (!Array.isArray(value)) {
        return false;
    }

    return value.every((component) => {
        if (
            !component ||
            typeof component !== "object" ||
            Array.isArray(component)
        ) {
            return false;
        }

        const item = component as Record<string, unknown>;

        return (
            typeof item.name === "string" &&
            item.name.trim().length > 0 &&
            typeof item.amount === "number" &&
            Number.isFinite(item.amount) &&
            item.amount >= 0
        );
    });
}

function validateCompensation(value: unknown): string | undefined {
    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        return "INVALID_COMPENSATION";
    }

    const compensation = value as Record<string, unknown>;

    if (
        typeof compensation.baseSalary !== "number" ||
        !Number.isFinite(compensation.baseSalary) ||
        compensation.baseSalary < 0
    ) {
        return "INVALID_BASE_SALARY";
    }

    if (
        compensation.allowances !== undefined &&
        !validateSalaryComponents(compensation.allowances)
    ) {
        return "INVALID_ALLOWANCES";
    }

    if (
        compensation.deductions !== undefined &&
        !validateSalaryComponents(compensation.deductions)
    ) {
        return "INVALID_DEDUCTIONS";
    }

    if (
        compensation.currency !== undefined &&
        (
            typeof compensation.currency !== "string" ||
            !/^[A-Za-z]{3}$/.test(compensation.currency)
        )
    ) {
        return "INVALID_CURRENCY";
    }

    if (compensation.effectiveFrom !== undefined) {
        if (
            typeof compensation.effectiveFrom !== "string" ||
            Number.isNaN(Date.parse(compensation.effectiveFrom))
        ) {
            return "INVALID_COMPENSATION_EFFECTIVE_DATE";
        }
    }

    const allowedFields = [
        "baseSalary",
        "allowances",
        "deductions",
        "currency",
        "effectiveFrom",
    ];

    if (
        Object.keys(compensation).some(
            (field) => !allowedFields.includes(field)
        )
    ) {
        return "INVALID_COMPENSATION_FIELDS";
    }

    return undefined;
}

function validateEmployeeOptionalFields(
    body: Record<string, unknown>
): string | undefined {
    for (const field of ["department", "designation", "phone"]) {
        if (!isOptionalString(body[field])) {
            return `${field.toUpperCase()}_MUST_BE_A_STRING`;
        }
    }

    if (
        body.status !== undefined &&
        (
            typeof body.status !== "string" ||
            !allowedEmployeeStatuses.includes(body.status)
        )
    ) {
        return "INVALID_EMPLOYEE_STATUS";
    }

    if (
        body.dateOfJoining !== undefined &&
        (
            typeof body.dateOfJoining !== "string" ||
            Number.isNaN(Date.parse(body.dateOfJoining))
        )
    ) {
        return "INVALID_DATE_OF_JOINING";
    }

    if (body.compensation !== undefined) {
        const error = validateCompensation(body.compensation);

        if (error) {
            return error;
        }
    }

    return undefined;
}

export function validateCreateEmployee(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const body = req.body;

    if (!isRequestBody(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    if (
        typeof body.userId !== "string" ||
        !body.userId.trim()
    ) {
        sendValidationError(res, "USER_ID_REQUIRED");
        return;
    }

    if (
        typeof body.employeeId !== "string" ||
        !body.employeeId.trim()
    ) {
        sendValidationError(res, "EMPLOYEE_ID_REQUIRED");
        return;
    }

    const error = validateEmployeeOptionalFields(body);

    if (error) {
        sendValidationError(res, error);
        return;
    }

    next();
}

export function validateUpdateEmployee(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const body = req.body;

    if (!isRequestBody(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    const fields = Object.keys(body);

    if (
        fields.length === 0 ||
        fields.some(
            (field) => !allowedEmployeeUpdateFields.includes(field)
        )
    ) {
        sendValidationError(res, "INVALID_OR_EMPTY_UPDATE_FIELDS");
        return;
    }

    if (
        body.employeeId !== undefined &&
        (
            typeof body.employeeId !== "string" ||
            !body.employeeId.trim()
        )
    ) {
        sendValidationError(res, "EMPLOYEE_ID_REQUIRED");
        return;
    }

    const error = validateEmployeeOptionalFields(body);

    if (error) {
        sendValidationError(res, error);
        return;
    }

    next();
}


const allowedAttendanceStatuses = [
    "present",
    "absent",
    "half-day",
    "on-leave",
];

const allowedAttendanceUpdateFields = [
    "date",
    "checkIn",
    "checkOut",
    "status",
    "remarks",
];

function isValidDateTime(value: unknown): boolean {
    return (
        typeof value === "string" &&
        value.trim().length > 0 &&
        !Number.isNaN(Date.parse(value))
    );
}

function validateAttendanceOptionalFields(
    body: Record<string, unknown>
): string | undefined {
    if (
        body.checkIn !== undefined &&
        !isValidDateTime(body.checkIn)
    ) {
        return "INVALID_CHECK_IN_TIME";
    }

    if (
        body.checkOut !== undefined &&
        !isValidDateTime(body.checkOut)
    ) {
        return "INVALID_CHECK_OUT_TIME";
    }

    if (
        body.status !== undefined &&
        (
            typeof body.status !== "string" ||
            !allowedAttendanceStatuses.includes(body.status)
        )
    ) {
        return "INVALID_ATTENDANCE_STATUS";
    }

    if (
        body.remarks !== undefined &&
        typeof body.remarks !== "string"
    ) {
        return "REMARKS_MUST_BE_A_STRING";
    }

    return undefined;
}

export function validateCreateAttendance(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const body = req.body;

    if (!isRequestBody(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    if (
        typeof body.employeeId !== "string" ||
        !body.employeeId.trim()
    ) {
        sendValidationError(res, "EMPLOYEE_ID_REQUIRED");
        return;
    }

    if (!isValidDate(body.date)) {
        sendValidationError(res, "INVALID_ATTENDANCE_DATE");
        return;
    }

    const error = validateAttendanceOptionalFields(body);

    if (error) {
        sendValidationError(res, error);
        return;
    }

    next();
}

export function validateUpdateAttendance(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const body = req.body;

    if (!isRequestBody(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    const fields = Object.keys(body);

    if (
        fields.length === 0 ||
        fields.some(
            (field) => !allowedAttendanceUpdateFields.includes(field)
        )
    ) {
        sendValidationError(res, "INVALID_OR_EMPTY_UPDATE_FIELDS");
        return;
    }

    if (
        body.date !== undefined &&
        !isValidDate(body.date)
    ) {
        sendValidationError(res, "INVALID_ATTENDANCE_DATE");
        return;
    }

    const error = validateAttendanceOptionalFields(body);

    if (error) {
        sendValidationError(res, error);
        return;
    }

    next();
}


const allowedLeaveTypes = [
    "casual",
    "sick",
    "earned",
    "unpaid",
    "other",
];

function validateLeaveFields(
    body: Record<string, unknown>
): string | undefined {
    if (
        typeof body.leaveType !== "string" ||
        !allowedLeaveTypes.includes(body.leaveType)
    ) {
        return "INVALID_LEAVE_TYPE";
    }

    if (!isValidDate(body.startDate)) {
        return "INVALID_START_DATE";
    }

    if (!isValidDate(body.endDate)) {
        return "INVALID_END_DATE";
    }

    if (
        typeof body.reason !== "string" ||
        !body.reason.trim()
    ) {
        return "INVALID_LEAVE_REASON";
    }

    if (body.reason.trim().length > 500) {
        return "LEAVE_REASON_TOO_LONG";
    }

    if (
        typeof body.startDate === "string" &&
        typeof body.endDate === "string" &&
        body.startDate > body.endDate
    ) {
        return "END_DATE_BEFORE_START_DATE";
    }

    return undefined;
}

export function validateCreateLeave(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const body = req.body;

    if (!isRequestBody(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    const allowedFields = [
        "employeeId",
        "leaveType",
        "startDate",
        "endDate",
        "reason",
    ];

    const fields = Object.keys(body);

    if (
        fields.some(
            (field) => !allowedFields.includes(field)
        )
    ) {
        sendValidationError(res, "INVALID_REQUEST_FIELDS");
        return;
    }

    if (
        typeof body.employeeId !== "string" ||
        !mongoose.isValidObjectId(body.employeeId)
    ) {
        sendValidationError(res, "INVALID_EMPLOYEE_ID");
        return;
    }

    const error = validateLeaveFields(body);

    if (error) {
        sendValidationError(res, error);
        return;
    }

    next();
}

export function validateApproveLeave(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const body = req.body;

    if (
        !isRequestBody(body) ||
        Object.keys(body).length > 0
    ) {
        sendValidationError(
            res,
            "INVALID_APPROVAL_REQUEST_BODY"
        );
        return;
    }

    next();
}

export function validateRejectLeave(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const body = req.body;

    if (!isRequestBody(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    if (
        Object.keys(body).some(
            (field) => field !== "rejectionReason"
        )
    ) {
        sendValidationError(res, "INVALID_REQUEST_FIELDS");
        return;
    }

    if (
        typeof body.rejectionReason !== "string" ||
        !body.rejectionReason.trim()
    ) {
        sendValidationError(res, "REJECTION_REASON_REQUIRED");
        return;
    }

    if (body.rejectionReason.trim().length > 500) {
        sendValidationError(res, "REJECTION_REASON_TOO_LONG");
        return;
    }

    next();
}


export function validateProcessPayroll(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const body = req.body;

    if (!isRequestBody(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    const allowedFields = [
        "employeeId",
        "periodStart",
        "periodEnd",
    ];

    const fields = Object.keys(body);

    if (
        fields.some(
            (field) => !allowedFields.includes(field)
        )
    ) {
        sendValidationError(res, "INVALID_REQUEST_FIELDS");
        return;
    }

    if (
        typeof body.employeeId !== "string" ||
        !mongoose.isValidObjectId(body.employeeId)
    ) {
        sendValidationError(res, "INVALID_EMPLOYEE_ID");
        return;
    }

    if (!isValidDate(body.periodStart)) {
        sendValidationError(res, "INVALID_PAYROLL_START_DATE");
        return;
    }

    if (!isValidDate(body.periodEnd)) {
        sendValidationError(res, "INVALID_PAYROLL_END_DATE");
        return;
    }

    if (
        typeof body.periodStart === "string" &&
        typeof body.periodEnd === "string" &&
        body.periodStart > body.periodEnd
    ) {
        sendValidationError(
            res,
            "PAYROLL_END_DATE_BEFORE_START_DATE"
        );
        return;
    }

    next();
}
