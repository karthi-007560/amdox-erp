import { Types } from "mongoose";
import Widget, { type WidgetType } from "../../models/dashboard/Widget";
import Dashboard from "../../models/dashboard/Dashboard";
import { Tenant } from "../../models/Tenant";
import { User } from "../../models/User";

interface WidgetPosition {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}

interface CreateWidgetInput {
    dashboardId: string;
    title: string;
    type: WidgetType;
    configuration?: Record<string, unknown>;
    position?: WidgetPosition;
    isVisible?: boolean;
}

interface UpdateWidgetInput {
    title?: string;
    type?: WidgetType;
    configuration?: Record<string, unknown>;
    position?: WidgetPosition;
    isVisible?: boolean;
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

const validateDashboard = async (
    tenantId: string,
    userId: string,
    dashboardId: string
) => {
    if (!Types.ObjectId.isValid(dashboardId)) {
        throw new Error("Invalid dashboard ID");
    }

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

const validatePosition = (position?: WidgetPosition) => {
    if (!position) {
        return;
    }

    for (const field of ["x", "y", "width", "height"] as const) {
        const value = position[field];

        if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
            throw new Error(`Widget position ${field} must be a non-negative integer`);
        }
    }

    if (position.width !== undefined && position.width < 1) {
        throw new Error("Widget width must be at least 1");
    }

    if (position.height !== undefined && position.height < 1) {
        throw new Error("Widget height must be at least 1");
    }
};

export const createWidget = async (
    tenantId: string,
    userId: string,
    input: CreateWidgetInput
) => {
    await validateActiveTenant(tenantId);
    await validateActiveUser(userId, tenantId);

    const title = input.title?.trim();

    if (!title) {
        throw new Error("Widget title is required");
    }

    await validateDashboard(tenantId, userId, input.dashboardId);
    validatePosition(input.position);

    return Widget.create({
        tenantId,
        dashboardId: input.dashboardId,
        userId,
        title,
        type: input.type,
        configuration: input.configuration ?? {},
        position: {
            x: input.position?.x ?? 0,
            y: input.position?.y ?? 0,
            width: input.position?.width ?? 4,
            height: input.position?.height ?? 3
        },
        isVisible: input.isVisible ?? true
    });
};

export const getAllWidgets = async (
    tenantId: string,
    userId: string,
    dashboardId: string
) => {
    await validateActiveTenant(tenantId);
    await validateActiveUser(userId, tenantId);
    await validateDashboard(tenantId, userId, dashboardId);

    return Widget.find({
        tenantId,
        userId,
        dashboardId
    }).sort({ "position.y": 1, "position.x": 1 });
};

export const getWidgetById = async (
    tenantId: string,
    userId: string,
    widgetId: string
) => {
    if (!Types.ObjectId.isValid(widgetId)) {
        throw new Error("Invalid widget ID");
    }

    await validateActiveTenant(tenantId);
    await validateActiveUser(userId, tenantId);

    const widget = await Widget.findOne({
        _id: widgetId,
        tenantId,
        userId
    });

    if (!widget) {
        throw new Error("Widget not found");
    }

    return widget;
};

export const updateWidget = async (
    tenantId: string,
    userId: string,
    widgetId: string,
    input: UpdateWidgetInput
) => {
    const widget = await getWidgetById(tenantId, userId, widgetId);

    validatePosition(input.position);

    if (input.title !== undefined) {
        if (!input.title.trim()) {
            throw new Error("Widget title cannot be empty");
        }

        widget.title = input.title.trim();
    }

    if (input.type !== undefined) {
        widget.type = input.type;
    }

    if (input.configuration !== undefined) {
        widget.configuration = input.configuration;
    }

    if (input.position !== undefined) {
        widget.position = {
            ...widget.position.toObject(),
            ...input.position
        };
    }

    if (input.isVisible !== undefined) {
        widget.isVisible = input.isVisible;
    }

    await widget.save();

    return widget;
};

export const deleteWidget = async (
    tenantId: string,
    userId: string,
    widgetId: string
) => {
    const widget = await getWidgetById(tenantId, userId, widgetId);

    await widget.deleteOne();

    return { message: "Widget deleted successfully" };
};