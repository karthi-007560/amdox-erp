import { Types } from "mongoose";

import Role from "../../models/Role.js";
import Permission from "../../models/Permission.js";
import { Tenant } from "../../models/Tenant.js";
import { User } from "../../models/User.js";

const permissionDefinitions = [
    // User management
    { name: "Read Users", module: "users", action: "read" },
    { name: "Create Users", module: "users", action: "create" },
    { name: "Update Users", module: "users", action: "update" },
    { name: "Delete Users", module: "users", action: "delete" },

    // Role management
    { name: "Read Roles", module: "roles", action: "read" },
    { name: "Create Roles", module: "roles", action: "create" },
    { name: "Update Roles", module: "roles", action: "update" },
    { name: "Delete Roles", module: "roles", action: "delete" },

    // Permission management
    { name: "Read Permissions", module: "permissions", action: "read" },
    { name: "Create Permissions", module: "permissions", action: "create" },
    { name: "Update Permissions", module: "permissions", action: "update" },
    { name: "Delete Permissions", module: "permissions", action: "delete" },

    // Finance
    { name: "Read Accounts", module: "finance.accounts", action: "read" },
    { name: "Create Accounts", module: "finance.accounts", action: "create" },
    { name: "Update Accounts", module: "finance.accounts", action: "update" },

    { name: "Read Currencies", module: "finance.currencies", action: "read" },
    { name: "Create Currencies", module: "finance.currencies", action: "create" },
    { name: "Update Currencies", module: "finance.currencies", action: "update" },

    { name: "Read Invoices", module: "finance.invoices", action: "read" },
    { name: "Create Invoices", module: "finance.invoices", action: "create" },
    { name: "Issue Invoices", module: "finance.invoices", action: "issue" },

    { name: "Read Payments", module: "finance.payments", action: "read" },
    { name: "Create Payments", module: "finance.payments", action: "create" },

    { name: "Read Journals", module: "finance.journals", action: "read" },
    { name: "Create Journals", module: "finance.journals", action: "create" },
    { name: "Post Journals", module: "finance.journals", action: "post" },
    { name: "Reverse Journals", module: "finance.journals", action: "reverse" },

    // HR
    { name: "Read Employees", module: "hr.employees", action: "read" },
    { name: "Create Employees", module: "hr.employees", action: "create" },
    { name: "Update Employees", module: "hr.employees", action: "update" },

    { name: "Read Attendance", module: "hr.attendance", action: "read" },
    { name: "Create Attendance", module: "hr.attendance", action: "create" },
    { name: "Update Attendance", module: "hr.attendance", action: "update" },

    { name: "Read Leaves", module: "hr.leaves", action: "read" },
    { name: "Create Leaves", module: "hr.leaves", action: "create" },
    { name: "Approve Leaves", module: "hr.leaves", action: "approve" },

    { name: "Read Payroll", module: "hr.payroll", action: "read" },
    { name: "Process Payroll", module: "hr.payroll", action: "process" },

    // Supply chain
    { name: "Read Inventory", module: "supplychain.inventory", action: "read" },
    { name: "Update Inventory", module: "supplychain.inventory", action: "update" },

    { name: "Read Vendors", module: "supplychain.vendors", action: "read" },
    { name: "Create Vendors", module: "supplychain.vendors", action: "create" },
    { name: "Update Vendors", module: "supplychain.vendors", action: "update" },

    { name: "Read Purchase Orders", module: "supplychain.purchase-orders", action: "read" },
    { name: "Create Purchase Orders", module: "supplychain.purchase-orders", action: "create" },
    { name: "Approve Purchase Orders", module: "supplychain.purchase-orders", action: "approve" },

    // Projects and tasks
    { name: "Read Projects", module: "projects", action: "read" },
    { name: "Create Projects", module: "projects", action: "create" },
    { name: "Update Projects", module: "projects", action: "update" },

    { name: "Read Tasks", module: "tasks", action: "read" },
    { name: "Create Tasks", module: "tasks", action: "create" },
    { name: "Update Tasks", module: "tasks", action: "update" },
];

const managerRestrictedModules = new Set([
    "users",
    "roles",
    "permissions",
]);

const employeeAllowedModules = new Set([
    "projects",
    "tasks",
    "hr.attendance",
    "hr.leaves",
]);

export const seedRoles = async (tenantId: string, createdBy: string) => {
    if (
        !Types.ObjectId.isValid(tenantId) ||
        !Types.ObjectId.isValid(createdBy)
    ) {
        throw new Error("Invalid tenant ID or creator ID");
    }

    const [tenant, admin] = await Promise.all([
        Tenant.findOne({ _id: tenantId, status: "active" }),
        User.findOne({
            _id: createdBy,
            tenantId,
            role: "admin",
            isActive: true,
        }),
    ]);

    if (!tenant) {
        throw new Error("Active tenant not found");
    }

    if (!admin) {
        throw new Error("An active admin user belonging to this tenant is required");
    }

    const permissionMap = new Map<string, Types.ObjectId>();

    for (const definition of permissionDefinitions) {
        const code = `${definition.module}.${definition.action}`;

        const permission = await Permission.findOneAndUpdate(
            { tenantId, code },
            {
                $setOnInsert: {
                    tenantId,
                    name: definition.name,
                    code,
                    module: definition.module,
                    action: definition.action,
                    isActive: true,
                },
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        );

        permissionMap.set(code, permission._id);
    }

    const allPermissions = permissionDefinitions.map(
        (item) => permissionMap.get(`${item.module}.${item.action}`)!
    );

    const managerPermissions = permissionDefinitions
        .filter(
            (item) =>
                !managerRestrictedModules.has(item.module) &&
                item.action !== "delete" &&
                item.action !== "process" &&
                item.action !== "reverse"
        )
        .map((item) => permissionMap.get(`${item.module}.${item.action}`)!);

    const employeePermissions = permissionDefinitions
        .filter(
            (item) =>
                employeeAllowedModules.has(item.module) &&
                ["read", "create", "update"].includes(item.action)
        )
        .map((item) => permissionMap.get(`${item.module}.${item.action}`)!);

    const roleDefinitions = [
        {
            name: "Administrator",
            code: "ADMIN",
            description: "System administrator with all seeded permissions",
            permissions: allPermissions,
        },
        {
            name: "Manager",
            code: "MANAGER",
            description: "Manager with operational permissions",
            permissions: managerPermissions,
        },
        {
            name: "Employee",
            code: "EMPLOYEE",
            description: "Employee with basic project and HR permissions",
            permissions: employeePermissions,
        },
    ];

    const roles = [];

    for (const definition of roleDefinitions) {
        const role = await Role.findOneAndUpdate(
            { tenantId, code: definition.code },
            {
                $set: {
                    name: definition.name,
                    description: definition.description,
                    permissions: definition.permissions,
                    isSystemRole: true,
                    isActive: true,
                },
                $setOnInsert: {
                    tenantId,
                    code: definition.code,
                    createdBy: admin._id,
                },
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        );

        roles.push(role);
    }

    return {
        permissionsCreatedOrFound: permissionMap.size,
        rolesCreatedOrUpdated: roles.length,
        roles,
    };
};