export const USER_ROLES = {
    ADMIN: "admin",
    MANAGER: "manager",
    EMPLOYEE: "employee",
} as const;

export const TENANT_STATUSES = {
    ACTIVE: "active",
    INACTIVE: "inactive",
    SUSPENDED: "suspended",
} as const;

export const INVOICE_STATUSES = {
    DRAFT: "draft",
    PENDING: "pending",
    PAID: "paid",
    OVERDUE: "overdue",
    CANCELLED: "cancelled",
} as const;

export const JOURNAL_STATUSES = {
    DRAFT: "draft",
    POSTED: "posted",
    REVERSED: "reversed",
} as const;

export const DEFAULTS = {
    PORT: 5001,
    JWT_EXPIRES_IN: "15m",
    BCRYPT_SALT_ROUNDS: 12,
} as const;

export const RATE_LIMITS = {
    WINDOW_MS: 15 * 60 * 1000,
    API_MAX_REQUESTS: 100,
    AUTH_MAX_REQUESTS: 10,
} as const;