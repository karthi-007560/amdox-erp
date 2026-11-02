
import Leave from "../../models/hr/Leave.js";
import type { ILeave } from "../../models/hr/Leave.js";

export async function createLeave(leaveData: Partial<ILeave>) {
    return Leave.create(leaveData);
}

export async function getLeaveById(
    leaveId: string,
    tenantId: string
) {
    return Leave.findOne({
        _id: leaveId,
        tenantId,
    })
        .populate("employeeId")
        .populate("tenantId", "name code")
        .populate("reviewedBy", "name email");
}

export async function getLeaveByEmployeeAndDateRange(
    employeeId: string,
    tenantId: string,
    startDate: Date,
    endDate: Date
) {
    return Leave.find({
        employeeId,
        tenantId,
        status: { $in: ["pending", "approved"] },
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
    });
}

export async function getLeavesByTenant(tenantId: string) {
    return Leave.find({ tenantId })
        .populate("employeeId")
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 });
}

export async function getLeavesByEmployee(
    employeeId: string,
    tenantId: string
) {
    return Leave.find({
        employeeId,
        tenantId,
    }).sort({ createdAt: -1 });
}

export async function updateLeave(
    leaveId: string,
    tenantId: string,
    updateData: Partial<ILeave>
) {
    return Leave.findOneAndUpdate(
        {
            _id: leaveId,
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
        .populate("reviewedBy", "name email");
}

export async function deleteLeave(
    leaveId: string,
    tenantId: string
) {
    return Leave.findOneAndDelete({
        _id: leaveId,
        tenantId,
    });
}

export async function getApprovedUnpaidLeavesByEmployeeAndDateRange(
    employeeId: string,
    tenantId: string,
    startDate: Date,
    endDate: Date
) {
    return Leave.find({
        employeeId,
        tenantId,
        leaveType: "unpaid",
        status: "approved",
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
    }).sort({ startDate: 1 });
}