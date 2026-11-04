
export type UserRole = "owner" | "employee";

export type Permission =
  | "dashboard:view"
  | "meetings:view"
  | "meetings:create"
  | "meetings:edit"
  | "tasks:view"
  | "tasks:create"
  | "tasks:assign"
  | "tasks:updateProgress"
  | "workspace:view"
  | "workspace:manage"
  | "team:view"
  | "team:manage"
  | "analytics:viewAll"
  | "analytics:viewOwn"
  | "settings:manage";

const ownerPermissions: Permission[] = [
  "dashboard:view",
  "meetings:view",
  "meetings:create",
  "meetings:edit",
  "tasks:view",
  "tasks:create",
  "tasks:assign",
  "tasks:updateProgress",
  "workspace:view",
  "workspace:manage",
  "team:view",
  "team:manage",
  "analytics:viewAll",
  "settings:manage",
];

const employeePermissions: Permission[] = [
  "meetings:view",
  "tasks:view",
  "tasks:updateProgress",
  "workspace:view",
  "analytics:viewOwn",
];

export function hasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  const permissions =
    role === "owner" ? ownerPermissions : employeePermissions;

  return permissions.includes(permission);
}
