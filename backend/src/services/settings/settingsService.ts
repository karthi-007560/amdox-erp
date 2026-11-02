
import { Types } from "mongoose";
import { Tenant, ITenantSettings } from "../../models/Tenant";

const validateActiveTenant = async (tenantId: string) => {
    if (!Types.ObjectId.isValid(tenantId)) {
        throw new Error("Invalid tenant ID");
    }

    const tenant = await Tenant.findOne({
        _id: tenantId,
        status: "active",
    });

    if (!tenant) {
        throw new Error("Active tenant not found");
    }

    return tenant;
};

export const getTenantSettings = async (tenantId: string) => {
    const tenant = await validateActiveTenant(tenantId);

    return {
        tenantId: tenant._id,
        tenantName: tenant.name,
        settings: tenant.settings || {},
    };
};

export const updateTenantSettings = async (
    tenantId: string,
    input: Partial<ITenantSettings>
) => {
    const tenant = await validateActiveTenant(tenantId);

    const allowedFields: (keyof ITenantSettings)[] = [
        "timezone",
        "language",
        "dateFormat",
        "currency",
    ];

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
        if (input[field] !== undefined) {
            updates[`settings.${field}`] = input[field];
        }
    }

    if (input.notifications !== undefined) {
        if (
            typeof input.notifications !== "object" ||
            input.notifications === null ||
            Array.isArray(input.notifications)
        ) {
            throw new Error("Invalid notification settings");
        }

        const notificationFields = ["email", "sms", "inApp"] as const;

        for (const field of notificationFields) {
            const value = input.notifications[field];

            if (value !== undefined) {
                if (typeof value !== "boolean") {
                    throw new Error(
                        `Notification setting ${field} must be a boolean`
                    );
                }

                updates[`settings.notifications.${field}`] = value;
            }
        }

        const allowedNotificationKeys = new Set(notificationFields);
        const suppliedKeys = Object.keys(input.notifications);

        if (suppliedKeys.some((key) => !allowedNotificationKeys.has(key as typeof notificationFields[number]))) {
            throw new Error("Unsupported notification setting");
        }
    }

    if (Object.keys(input).some((key) => ![...allowedFields, "notifications"].includes(key as keyof ITenantSettings))) {
        throw new Error("Unsupported tenant setting");
    }

    if (Object.keys(updates).length === 0) {
        throw new Error("No valid settings provided");
    }

    const updatedTenant = await Tenant.findOneAndUpdate(
        {
            _id: tenant._id,
            status: "active",
        },
        {
            $set: updates,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!updatedTenant) {
        throw new Error("Unable to update tenant settings");
    }

    return {
        tenantId: updatedTenant._id,
        tenantName: updatedTenant.name,
        settings: updatedTenant.settings || {},
    };
};

export const resetTenantSettings = async (tenantId: string) => {
    const tenant = await validateActiveTenant(tenantId);

    const updatedTenant = await Tenant.findOneAndUpdate(
        {
            _id: tenant._id,
            status: "active",
        },
        {
            $unset: {
                settings: 1,
            },
        },
        {
            new: true,
        }
    );

    if (!updatedTenant) {
        throw new Error("Unable to reset tenant settings");
    }

    return {
        tenantId: updatedTenant._id,
        tenantName: updatedTenant.name,
        settings: updatedTenant.settings || {},
    };
};
