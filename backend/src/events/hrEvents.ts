export const HR_EVENTS = {
    EMPLOYEE_CREATED: "hr.employee_created",
    EMPLOYEE_UPDATED: "hr.employee_updated",
    EMPLOYEE_DEACTIVATED: "hr.employee_deactivated",
    ATTENDANCE_RECORDED: "hr.attendance_recorded",
    LEAVE_REQUESTED: "hr.leave_requested",
    LEAVE_APPROVED: "hr.leave_approved",
    LEAVE_REJECTED: "hr.leave_rejected",
    PAYROLL_PROCESSED: "hr.payroll_processed",
    PAYSLIP_GENERATED: "hr.payslip_generated",
} as const;

export interface HREventPayload {
    tenantId: string;
    actorId?: string;
    employeeId?: string;
    attendanceId?: string;
    leaveId?: string;
    payrollId?: string;
    payslipId?: string;
    status?: string;
    metadata?: Record<string, unknown>;
}

export interface HREventMap {
    [HR_EVENTS.EMPLOYEE_CREATED]: HREventPayload;
    [HR_EVENTS.EMPLOYEE_UPDATED]: HREventPayload;
    [HR_EVENTS.EMPLOYEE_DEACTIVATED]: HREventPayload;
    [HR_EVENTS.ATTENDANCE_RECORDED]: HREventPayload;
    [HR_EVENTS.LEAVE_REQUESTED]: HREventPayload;
    [HR_EVENTS.LEAVE_APPROVED]: HREventPayload;
    [HR_EVENTS.LEAVE_REJECTED]: HREventPayload;
    [HR_EVENTS.PAYROLL_PROCESSED]: HREventPayload;
    [HR_EVENTS.PAYSLIP_GENERATED]: HREventPayload;
}