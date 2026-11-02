
import { Types } from "mongoose";
import Permission from "../../models/Permission";
import Role from "../../models/Role";
import { Tenant } from "../../models/Tenant";

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

export const createPermission = async (
    tenantId: string,
    input: {
        name: string;
        code: string;
        description?: string;
        module: string;
        action: string;
    }
) => {
    await validateActiveTenant(tenantId);

    const name = input.name?.trim();
    const code = input.code?.trim().toLowerCase();
    const module = input.module?.trim().toLowerCase();
    const action = input.action?.trim().toLowerCase();

    if (!name || !code || !module || !action) {
        throw new Error(
            "Permission name, code, module and action are required"
        );
    }

    const existingPermission = await Permission.findOne({
        tenantId,
        code,
    });

    if (existingPermission) {
        throw new Error("Permission code already exists");
    }

    return Permission.create({
        tenantId,
        name,
        code,
        description: input.description?.trim(),
        module,
        action,
    });
};

export const listPermissions = async (
    tenantId: string,
    options: {
        page?: number;
        limit?: number;
        module?: string;
        isActive?: boolean;
    } = {}
) => {
    await validateActiveTenant(tenantId);

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));

    const filter: Record<string, unknown> = { tenantId };

    if (options.module) {
        filter.module = options.module.trim().toLowerCase();
    }

    if (options.isActive !== undefined) {
        filter.isActive = options.isActive;
    }

    const [permissions, total] = await Promise.all([
        Permission.find(filter)
            .sort({ module: 1, action: 1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Permission.countDocuments(filter),
    ]);

    return {
        permissions,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getPermissionById = async (
    tenantId: string,
    permissionId: string
) => {
    await validateActiveTenant(tenantId);

    if (!Types.ObjectId.isValid(permissionId)) {
        throw new Error("Invalid permission ID");
    }

    const permission = await Permission.findOne({
        _id: permissionId,
        tenantId,
    });

    if (!permission) {
        throw new Error("Permission not found");
    }

    return permission;
};

export const updatePermission = async (
    tenantId: string,
    permissionId: string,
    input: {
        name?: string;
        code?: string;
        description?: string;
        module?: string;
        action?: string;
        isActive?: boolean;
    }
) => {
    await validateActiveTenant(tenantId);

    if (!Types.ObjectId.isValid(permissionId)) {
        throw new Error("Invalid permission ID");
    }

    const permission = await Permission.findOne({
        _id: permissionId,
        tenantId,
    });

    if (!permission) {
        throw new Error("Permission not found");
    }

    if (input.name !== undefined) {
        const name = input.name.trim();

        if (!name) {
            throw new Error("Permission name cannot be empty");
        }

        permission.name = name;
    }

    if (input.code !== undefined) {
        const code = input.code.trim().toLowerCase();

        if (!code) {
            throw new Error("Permission code cannot be empty");
        }

        const duplicate = await Permission.findOne({
            tenantId,
            code,
            _id: { $ne: permission._id },
        });

        if (duplicate) {
            throw new Error("Permission code already exists");
        }

        permission.code = code;
    }

    if (input.description !== undefined) {
        permission.description = input.description.trim();
    }

    if (input.module !== undefined) {
        const module = input.module.trim().toLowerCase();

        if (!module) {
            throw new Error("Permission module cannot be empty");
        }

        permission.module = module;
    }

    if (input.action !== undefined) {
        const action = input.action.trim().toLowerCase();

        if (!action) {
            throw new Error("Permission action cannot be empty");
        }

        permission.action = action;
    }

    if (input.isActive !== undefined) {
        if (!input.isActive) {
            const assignedRole = await Role.findOne({
                tenantId,
                permissions: permission._id,
                isActive: true,
            });

            if (assignedRole) {
                throw new Error(
                    "Permission is assigned to an active role and cannot be deactivated"
                );
            }
        }

        permission.isActive = input.isActive;
    }

    await permission.save();

    return permission;
};

export const deletePermission = async (
    tenantId: string,
    permissionId: string
) => {
    await validateActiveTenant(tenantId);

    if (!Types.ObjectId.isValid(permissionId)) {
        throw new Error("Invalid permission ID");
    }

    const permission = await Permission.findOne({
        _id: permissionId,
        tenantId,
    });

    if (!permission) {
        throw new Error("Permission not found");
    }

    const assignedRole = await Role.findOne({
        tenantId,
        permissions: permission._id,
    });

    if (assignedRole) {
        throw new Error(
            "Permission is assigned to a role and cannot be deleted"
        );
    }

    await permission.deleteOne();

    return {
        message: "Permission deleted successfully",
    };
};
