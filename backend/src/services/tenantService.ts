import mongoose from "mongoose";
import type { ITenantSettings } from "../models/Tenant";
import {
    createTenant,
    findTenantByCode,
    findTenantById,
    findAllTenants,
    updateTenantById,
} from "../repositories/tenantRepository";
import {
    assignUserToTenant,
    findUserById,
} from "../repositories/userRepository";

interface CreateTenantInput {
    name: string;
    code: string;
    createdBy?: string;
}

interface UpdateTenantInput {
    name?: string;
    code?: string;
    status?: string;
    settings?: Partial<ITenantSettings>;
}

export async function createTenantService(input: CreateTenantInput) {
    const name = input.name.trim();
    const code = input.code.trim().toUpperCase();

    if (!name || !code) {
        throw new Error("TENANT_NAME_AND_CODE_REQUIRED");
    }

    const existingTenant = await findTenantByCode(code);

    if (existingTenant) {
        throw new Error("TENANT_CODE_ALREADY_EXISTS");
    }

    return createTenant({
        name,
        code,
        createdBy: input.createdBy,
    });
}

export async function getTenantByIdService(tenantId: string) {
    if (!mongoose.isValidObjectId(tenantId)) {
        throw new Error("INVALID_TENANT_ID");
    }

    const tenant = await findTenantById(tenantId);

    if (!tenant) {
        throw new Error("TENANT_NOT_FOUND");
    }

    return tenant;
}

export async function getAllTenantsService() {
    return findAllTenants();
}

export async function updateTenantService(
    tenantId: string,
    input: UpdateTenantInput
) {
    if (!mongoose.isValidObjectId(tenantId)) {
        throw new Error("INVALID_TENANT_ID");
    }

    const tenant = await findTenantById(tenantId);

    if (!tenant) {
        throw new Error("TENANT_NOT_FOUND");
    }

    const updates: Record<string, unknown> = {};

    if (input.name !== undefined) {
        if (typeof input.name !== "string" || !input.name.trim()) {
            throw new Error("INVALID_TENANT_NAME");
        }

        updates.name = input.name.trim();
    }

    if (input.code !== undefined) {
        if (typeof input.code !== "string" || !input.code.trim()) {
            throw new Error("INVALID_TENANT_CODE");
        }

        const code = input.code.trim().toUpperCase();

        const existingTenant = await findTenantByCode(code);

        if (
            existingTenant &&
            existingTenant._id.toString() !== tenantId
        ) {
            throw new Error("TENANT_CODE_ALREADY_EXISTS");
        }

        updates.code = code;
    }

    if (input.status !== undefined) {
        const allowedStatuses = ["active", "inactive", "suspended"];

        if (!allowedStatuses.includes(input.status)) {
            throw new Error("INVALID_TENANT_STATUS");
        }

        updates.status = input.status;
    }

    if (input.settings !== undefined) {
        if (
            typeof input.settings !== "object" ||
            input.settings === null ||
            Array.isArray(input.settings)
        ) {
            throw new Error("INVALID_TENANT_SETTINGS");
        }

        const allowedSettings = [
            "timezone",
            "language",
            "dateFormat",
            "currency",
            "notifications",
            "integrations",
        ];

        for (const key of Object.keys(input.settings)) {
            if (!allowedSettings.includes(key)) {
                throw new Error("INVALID_TENANT_SETTINGS");
            }
        }

        const settings = input.settings;

        if (settings.timezone !== undefined) {
            updates["settings.timezone"] = settings.timezone;
        }

        if (settings.language !== undefined) {
            updates["settings.language"] = settings.language;
        }

        if (settings.dateFormat !== undefined) {
            updates["settings.dateFormat"] = settings.dateFormat;
        }

        if (settings.currency !== undefined) {
            updates["settings.currency"] = settings.currency;
        }

        if (settings.notifications !== undefined) {
            if (
                typeof settings.notifications !== "object" ||
                settings.notifications === null ||
                Array.isArray(settings.notifications)
            ) {
                throw new Error("INVALID_TENANT_SETTINGS");
            }

            for (const key of Object.keys(settings.notifications)) {
                if (!["email", "sms", "inApp"].includes(key)) {
                    throw new Error("INVALID_TENANT_SETTINGS");
                }
            }

            for (const [key, value] of Object.entries(
                settings.notifications
            )) {
                if (typeof value !== "boolean") {
                    throw new Error("INVALID_TENANT_SETTINGS");
                }

                updates[`settings.notifications.${key}`] = value;
            }
        }

        if (settings.integrations !== undefined) {
            if (!Array.isArray(settings.integrations)) {
                throw new Error("INVALID_TENANT_SETTINGS");
            }

            updates["settings.integrations"] = settings.integrations;
        }
    }

    if (Object.keys(updates).length === 0) {
        throw new Error("NO_TENANT_UPDATES_PROVIDED");
    }

    const updatedTenant = await updateTenantById(tenantId, updates);

    if (!updatedTenant) {
        throw new Error("TENANT_UPDATE_FAILED");
    }

    return updatedTenant;
}

export async function assignUserToTenantService(
    userId: string,
    tenantId: string
) {
    if (
        !mongoose.isValidObjectId(userId) ||
        !mongoose.isValidObjectId(tenantId)
    ) {
        throw new Error("INVALID_USER_OR_TENANT_ID");
    }

    const tenant = await findTenantById(tenantId);

    if (!tenant) {
        throw new Error("TENANT_NOT_FOUND");
    }

    if (tenant.status !== "active") {
        throw new Error("TENANT_NOT_ACTIVE");
    }

    const user = await findUserById(userId);

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    if (user.tenantId) {
        throw new Error("USER_ALREADY_ASSIGNED_TO_TENANT");
    }

    const updatedUser = await assignUserToTenant(userId, tenantId);

    if (!updatedUser) {
        const currentUser = await findUserById(userId);

        if (!currentUser) {
            throw new Error("USER_NOT_FOUND");
        }

        if (currentUser.tenantId) {
            throw new Error("USER_ALREADY_ASSIGNED_TO_TENANT");
        }

        throw new Error("USER_ASSIGNMENT_FAILED");
    }

    return updatedUser;
}