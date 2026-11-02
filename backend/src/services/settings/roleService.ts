
import { Types } from "mongoose";
import Role from "../../models/Role";
import Permission from "../../models/Permission";
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

const validatePermissions = async (
    tenantId: string,
    permissionIds: string[]
) => {
    if (!Array.isArray(permissionIds)) {
        throw new Error("Permissions must be an array");
    }

    const uniqueIds = [...new Set(permissionIds)];

    if (uniqueIds.some((id) => !Types.ObjectId.isValid(id))) {
        throw new Error("Invalid permission ID");
    }

    const permissions = await Permission.find({
        _id: { $in: uniqueIds },
        tenantId,
        isActive: true,
    }).select("_id");

    if (permissions.length !== uniqueIds.length) {
        throw new Error("One or more permissions are invalid or inactive");
    }

    return permissions.map((permission) => permission._id);
};

export const createRole = async (
    tenantId: string,
    createdBy: string,
    input: {
        name: string;
        code: string;
        description?: string;
        permissions?: string[];
    }
) => {
    await validateActiveTenant(tenantId);

    if (!Types.ObjectId.isValid(createdBy)) {
        throw new Error("Invalid creator ID");
    }

    const name = input.name?.trim();
    const code = input.code?.trim().toUpperCase();

    if (!name || !code) {
        throw new Error("Role name and code are required");
    }

    const permissions = await validatePermissions(
        tenantId,
        input.permissions || []
    );

    const existingRole = await Role.findOne({
        tenantId,
        code,
    });

    if (existingRole) {
        throw new Error("Role code already exists");
    }

    return Role.create({
        tenantId,
        name,
        code,
        description: input.description?.trim(),
        permissions,
        createdBy,
    });
};

export const listRoles = async (
    tenantId: string,
    options: {
        page?: number;
        limit?: number;
        isActive?: boolean;
    } = {}
) => {
    await validateActiveTenant(tenantId);

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));

    const filter: Record<string, unknown> = { tenantId };

    if (options.isActive !== undefined) {
        filter.isActive = options.isActive;
    }

    const [roles, total] = await Promise.all([
        Role.find(filter)
            .populate("permissions")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Role.countDocuments(filter),
    ]);

    return {
        roles,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getRoleById = async (
    tenantId: string,
    roleId: string
) => {
    await validateActiveTenant(tenantId);

    if (!Types.ObjectId.isValid(roleId)) {
        throw new Error("Invalid role ID");
    }

    const role = await Role.findOne({
        _id: roleId,
        tenantId,
    }).populate("permissions");

    if (!role) {
        throw new Error("Role not found");
    }

    return role;
};

export const updateRole = async (
    tenantId: string,
    roleId: string,
    input: {
        name?: string;
        code?: string;
        description?: string;
        permissions?: string[];
        isActive?: boolean;
    }
) => {
    await validateActiveTenant(tenantId);

    if (!Types.ObjectId.isValid(roleId)) {
        throw new Error("Invalid role ID");
    }

    const role = await Role.findOne({
        _id: roleId,
        tenantId,
    });

    if (!role) {
        throw new Error("Role not found");
    }

    if (role.isSystemRole) {
        throw new Error("System roles cannot be modified");
    }

    if (input.name !== undefined) {
        const name = input.name.trim();

        if (!name) {
            throw new Error("Role name cannot be empty");
        }

        role.name = name;
    }

    if (input.code !== undefined) {
        const code = input.code.trim().toUpperCase();

        if (!code) {
            throw new Error("Role code cannot be empty");
        }

        const duplicate = await Role.findOne({
            tenantId,
            code,
            _id: { $ne: role._id },
        });

        if (duplicate) {
            throw new Error("Role code already exists");
        }

        role.code = code;
    }

    if (input.description !== undefined) {
        role.description = input.description.trim();
    }

    if (input.permissions !== undefined) {
        role.permissions = await validatePermissions(
            tenantId,
            input.permissions
        );
    }

    if (input.isActive !== undefined) {
        role.isActive = input.isActive;
    }

    await role.save();

    return role.populate("permissions");
};

export const deleteRole = async (
    tenantId: string,
    roleId: string
) => {
    await validateActiveTenant(tenantId);

    if (!Types.ObjectId.isValid(roleId)) {
        throw new Error("Invalid role ID");
    }

    const role = await Role.findOne({
        _id: roleId,
        tenantId,
    });

    if (!role) {
        throw new Error("Role not found");
    }

    if (role.isSystemRole) {
        throw new Error("System roles cannot be deleted");
    }

    await role.deleteOne();

    return {
        message: "Role deleted successfully",
    };
};
