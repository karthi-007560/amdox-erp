
import mongoose from "mongoose";

import {
    findUsersByTenantId,
    findUserByIdAndTenant,
    updateUserByIdAndTenant,
    findUserByEmail,
} from "../repositories/userRepository";

import { findTenantById } from "../repositories/tenantRepository";

type UserRole = "admin" | "manager" | "employee";

interface UpdateUserInput {
    name?: string;
    email?: string;
    role?: UserRole;
    isActive?: boolean;
}

async function validateActiveTenant(tenantId: string) {
    if (!mongoose.isValidObjectId(tenantId)) {
        throw new Error("INVALID_TENANT_ID");
    }

    const tenant = await findTenantById(tenantId);

    if (!tenant) {
        throw new Error("TENANT_NOT_FOUND");
    }

    if (tenant.status !== "active") {
        throw new Error("TENANT_NOT_ACTIVE");
    }

    return tenant;
}

export async function getUsersService(tenantId: string) {
    await validateActiveTenant(tenantId);

    return findUsersByTenantId(tenantId);
}

export async function getUserByIdService(
    userId: string,
    tenantId: string
) {
    if (!mongoose.isValidObjectId(userId)) {
        throw new Error("INVALID_USER_ID");
    }

    await validateActiveTenant(tenantId);

    const user = await findUserByIdAndTenant(userId, tenantId);

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    return user;
}

export async function updateUserService(
    userId: string,
    tenantId: string,
    actorId: string,
    actorRole: UserRole,
    updates: UpdateUserInput
) {
    if (!mongoose.isValidObjectId(userId)) {
        throw new Error("INVALID_USER_ID");
    }

    if (!mongoose.isValidObjectId(actorId)) {
        throw new Error("INVALID_ACTOR_ID");
    }

    await validateActiveTenant(tenantId);

    const existingUser = await findUserByIdAndTenant(
        userId,
        tenantId
    );

    if (!existingUser) {
        throw new Error("USER_NOT_FOUND");
    }

    if (userId === actorId) {
        if (updates.role !== undefined) {
            throw new Error("CANNOT_CHANGE_OWN_ROLE");
        }

        if (updates.isActive === false) {
            throw new Error("CANNOT_DEACTIVATE_OWN_ACCOUNT");
        }
    }

    if (updates.role !== undefined && actorRole !== "admin") {
        throw new Error("ONLY_ADMIN_CAN_CHANGE_USER_ROLE");
    }

    if (updates.name !== undefined) {
        updates.name = updates.name.trim();

        if (!updates.name) {
            throw new Error("USER_NAME_REQUIRED");
        }
    }

    if (updates.email !== undefined) {
        updates.email = updates.email.trim().toLowerCase();

        if (!updates.email) {
            throw new Error("USER_EMAIL_REQUIRED");
        }

        const duplicateUser = await findUserByEmail(updates.email);

        if (
            duplicateUser &&
            duplicateUser._id.toString() !== userId
        ) {
            throw new Error("EMAIL_ALREADY_EXISTS");
        }
    }

    if (Object.keys(updates).length === 0) {
        throw new Error("NO_VALID_FIELDS_TO_UPDATE");
    }

    const updatedUser = await updateUserByIdAndTenant(
        userId,
        tenantId,
        updates
    );

    if (!updatedUser) {
        throw new Error("USER_UPDATE_FAILED");
    }

    return updatedUser;
}
