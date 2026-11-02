import {
    USER_ROLES,
    TENANT_STATUSES,
    INVOICE_STATUSES,
    JOURNAL_STATUSES,
    DEFAULTS,
    RATE_LIMITS,
} from "../../../src/utils/constants";

describe("Application Constants", () => {
    it("should define the expected user roles", () => {
        expect(USER_ROLES).toEqual({
            ADMIN: "admin",
            MANAGER: "manager",
            EMPLOYEE: "employee",
        });
    });

    it("should define the expected tenant statuses", () => {
        expect(TENANT_STATUSES).toEqual({
            ACTIVE: "active",
            INACTIVE: "inactive",
            SUSPENDED: "suspended",
        });
    });

    it("should define the expected invoice statuses", () => {
        expect(INVOICE_STATUSES).toEqual({
            DRAFT: "draft",
            PENDING: "pending",
            PAID: "paid",
            OVERDUE: "overdue",
            CANCELLED: "cancelled",
        });
    });

    it("should define the expected journal statuses", () => {
        expect(JOURNAL_STATUSES).toEqual({
            DRAFT: "draft",
            POSTED: "posted",
            REVERSED: "reversed",
        });
    });

    it("should define the expected application defaults", () => {
        expect(DEFAULTS).toEqual({
            PORT: 5001,
            JWT_EXPIRES_IN: "15m",
            BCRYPT_SALT_ROUNDS: 12,
        });
    });

    it("should use a valid port number", () => {
        expect(DEFAULTS.PORT).toBeGreaterThan(0);
        expect(DEFAULTS.PORT).toBeLessThanOrEqual(65535);
    });

    it("should define the expected rate limits", () => {
        expect(RATE_LIMITS).toEqual({
            WINDOW_MS: 900000,
            API_MAX_REQUESTS: 100,
            AUTH_MAX_REQUESTS: 10,
        });
    });

    it("should apply a stricter limit to authentication requests", () => {
        expect(RATE_LIMITS.AUTH_MAX_REQUESTS)
            .toBeLessThan(RATE_LIMITS.API_MAX_REQUESTS);
    });
});
