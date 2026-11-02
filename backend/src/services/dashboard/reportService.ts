import { Types } from "mongoose";
import Report, {
    type ReportType,
    type ReportStatus
} from "../../models/dashboard/Report";
import { Tenant } from "../../models/Tenant";
import { User } from "../../models/User";

interface CreateReportInput {
    name: string;
    description?: string;
    type: ReportType;
    filters?: Record<string, unknown>;
    columns?: string[];
    status?: ReportStatus;
    isShared?: boolean;
}

interface UpdateReportInput {
    name?: string;
    description?: string;
    type?: ReportType;
    filters?: Record<string, unknown>;
    columns?: string[];
    status?: ReportStatus;
    isShared?: boolean;
}

const validateActiveTenant = async (tenantId: string) => {
    if (!Types.ObjectId.isValid(tenantId)) {
        throw new Error("Invalid tenant ID");
    }

    const tenant = await Tenant.findOne({
        _id: tenantId,
        status: "active"
    });

    if (!tenant) {
        throw new Error("Active tenant not found");
    }
};

const validateActiveUser = async (userId: string, tenantId: string) => {
    if (!Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
    }

    const user = await User.findOne({
        _id: userId,
        tenantId,
        isActive: true
    });

    if (!user) {
        throw new Error("Active tenant user not found");
    }
};

export const createReport = async (
    tenantId: string,
    userId: string,
    input: CreateReportInput
) => {
    await validateActiveTenant(tenantId);
    await validateActiveUser(userId, tenantId);

    const name = input.name?.trim();

    if (!name) {
        throw new Error("Report name is required");
    }

    return Report.create({
        tenantId,
        createdBy: userId,
        name,
        description: input.description,
        type: input.type,
        filters: input.filters ?? {},
        columns: input.columns ?? [],
        status: input.status ?? "draft",
        isShared: input.isShared ?? false
    });
};

export const getAllReports = async (
    tenantId: string,
    userId: string,
    filters?: {
        type?: ReportType;
        status?: ReportStatus;
    }
) => {
    await validateActiveTenant(tenantId);
    await validateActiveUser(userId, tenantId);

    const query: Record<string, unknown> = {
        tenantId,
        $or: [
            { createdBy: userId },
            { isShared: true }
        ]
    };

    if (filters?.type) {
        query.type = filters.type;
    }

    if (filters?.status) {
        query.status = filters.status;
    }

    return Report.find(query)
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });
};

export const getReportById = async (
    tenantId: string,
    userId: string,
    reportId: string
) => {
    if (!Types.ObjectId.isValid(reportId)) {
        throw new Error("Invalid report ID");
    }

    await validateActiveTenant(tenantId);
    await validateActiveUser(userId, tenantId);

    const report = await Report.findOne({
        _id: reportId,
        tenantId,
        $or: [
            { createdBy: userId },
            { isShared: true }
        ]
    }).populate("createdBy", "name email");

    if (!report) {
        throw new Error("Report not found");
    }

    return report;
};

export const updateReport = async (
    tenantId: string,
    userId: string,
    reportId: string,
    input: UpdateReportInput
) => {
    if (!Types.ObjectId.isValid(reportId)) {
        throw new Error("Invalid report ID");
    }

    await validateActiveTenant(tenantId);
    await validateActiveUser(userId, tenantId);

    const report = await Report.findOne({
        _id: reportId,
        tenantId,
        createdBy: userId
    });

    if (!report) {
        throw new Error("Report not found or you do not have permission to update it");
    }

    if (input.name !== undefined) {
        if (!input.name.trim()) {
            throw new Error("Report name cannot be empty");
        }

        report.name = input.name.trim();
    }

    if (input.description !== undefined) {
        report.description = input.description;
    }

    if (input.type !== undefined) {
        report.type = input.type;
    }

    if (input.filters !== undefined) {
        report.filters = input.filters;
    }

    if (input.columns !== undefined) {
        report.columns = input.columns;
    }

    if (input.status !== undefined) {
        report.status = input.status;
    }

    if (input.isShared !== undefined) {
        report.isShared = input.isShared;
    }

    await report.save();

    return report;
};

export const deleteReport = async (
    tenantId: string,
    userId: string,
    reportId: string
) => {
    if (!Types.ObjectId.isValid(reportId)) {
        throw new Error("Invalid report ID");
    }

    await validateActiveTenant(tenantId);
    await validateActiveUser(userId, tenantId);

    const report = await Report.findOneAndDelete({
        _id: reportId,
        tenantId,
        createdBy: userId
    });

    if (!report) {
        throw new Error("Report not found or you do not have permission to delete it");
    }

    return { message: "Report deleted successfully" };
};