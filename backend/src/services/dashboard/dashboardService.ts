import { Types } from "mongoose";
import Dashboard from "../../models/dashboard/Dashboard";
import Widget from "../../models/dashboard/Widget";
import { Tenant } from "../../models/Tenant";
import { User } from "../../models/User";

interface CreateDashboardInput {
    name: string;
    description?: string;
    layout?: "grid" | "list";
    isDefault?: boolean;
}

interface UpdateDashboardInput {
    name?: string;
    description?: string;
    layout?: "grid" | "list";
    isDefault?: boolean;
    isActive?: boolean;
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

export const createDashboard = async (
    tenantId: string,
    userId: string,
    input: CreateDashboardInput
) => {
    await validateActiveTenant(tenantId);
    await validateActiveUser(userId, tenantId);

    const name = input.name?.trim();

    if (!name) {
        throw new Error("Dashboard name is required");
    }

    if (input.isDefault) {
        await Dashboard.updateMany(
            { tenantId, userId },
            { $set: { isDefault: false } }
        );
    }

    return Dashboard.create({
        tenantId,
        userId,
        name,
        description: input.description,
        layout: input.layout ?? "grid",
        isDefault: input.isDefault ?? false
    });
};

export const getAllDashboards = async (
    tenantId: string,
    userId: string
) => {
    await validateActiveTenant(tenantId);
    await validateActiveUser(userId, tenantId);

    return Dashboard.find({
        tenantId,
        userId
    }).sort({ isDefault: -1, createdAt: -1 });
};

export const getDashboardById = async (
    tenantId: string,
    userId: string,
    dashboardId: string
) => {
    if (!Types.ObjectId.isValid(dashboardId)) {
        throw new Error("Invalid dashboard ID");
    }

    await validateActiveTenant(tenantId);
    await validateActiveUser(userId, tenantId);

    const dashboard = await Dashboard.findOne({
        _id: dashboardId,
        tenantId,
        userId
    });

    if (!dashboard) {
        throw new Error("Dashboard not found");
    }

    return dashboard;
};

export const updateDashboard = async (
    tenantId: string,
    userId: string,
    dashboardId: string,
    input: UpdateDashboardInput
) => {
    const dashboard = await getDashboardById(
        tenantId,
        userId,
        dashboardId
    );

    if (input.name !== undefined) {
        if (!input.name.trim()) {
            throw new Error("Dashboard name cannot be empty");
        }

        dashboard.name = input.name.trim();
    }

    if (input.description !== undefined) {
        dashboard.description = input.description;
    }

    if (input.layout !== undefined) {
        dashboard.layout = input.layout;
    }

    if (input.isActive !== undefined) {
        dashboard.isActive = input.isActive;
    }

    if (input.isDefault === true) {
        await Dashboard.updateMany(
            {
                tenantId,
                userId,
                _id: { $ne: dashboardId }
            },
            { $set: { isDefault: false } }
        );
    }

    if (input.isDefault !== undefined) {
        dashboard.isDefault = input.isDefault;
    }

    await dashboard.save();

    return dashboard;
};

export const deleteDashboard = async (
    tenantId: string,
    userId: string,
    dashboardId: string
) => {
    const dashboard = await getDashboardById(
        tenantId,
        userId,
        dashboardId
    );

    await Widget.deleteMany({
        tenantId,
        dashboardId: dashboard._id
    });

    await dashboard.deleteOne();

    return { message: "Dashboard deleted successfully" };
};

export const getDashboardOverview = async (
    tenantId: string,
    userId: string,
    dashboardId: string
) => {
    const dashboard = await getDashboardById(
        tenantId,
        userId,
        dashboardId
    );

    const widgets = await Widget.find({
        tenantId,
        dashboardId: dashboard._id,
        userId,
        isVisible: true
    }).sort({ "position.y": 1, "position.x": 1 });

    return {
        dashboard,
        widgets
    };
};