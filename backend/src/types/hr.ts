import type { IPayslip } from "../models/hr/Payslip.js";

export type {
    AttendanceStatus,
    IAttendance,
} from "../models/hr/Attendance.js";

export type {
    EmployeeStatus,
    IEmployeeSalaryComponent,
    IEmployeeCompensation,
    IEmployee,
} from "../models/hr/Employee.js";

export type {
    LeaveType,
    LeaveStatus,
    ILeave,
} from "../models/hr/Leave.js";

export type {
    PayrollStatus,
    ISalaryComponent,
    IPayroll,
} from "../models/hr/Payroll.js";

export type {
    IPayslip,
} from "../models/hr/Payslip.js";

export type PayslipStatus = IPayslip["status"];