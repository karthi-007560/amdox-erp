import {
    normalizeEmail,
    normalizeCode,
    isNonEmptyString,
    isValidDate,
    removeUndefinedFields,
} from "../../../src/utils/helpers";

describe("Helper Utilities", () => {
    describe("normalizeEmail", () => {
        it("should convert an email to lowercase", () => {
            expect(normalizeEmail("USER@EXAMPLE.COM")).toBe("user@example.com");
        });

        it("should remove leading and trailing whitespace", () => {
            expect(normalizeEmail("  user@example.com  ")).toBe("user@example.com");
        });

        it("should handle an already normalized email", () => {
            expect(normalizeEmail("user@example.com")).toBe("user@example.com");
        });
    });

    describe("normalizeCode", () => {
        it("should convert a code to uppercase", () => {
            expect(normalizeCode("tenant-abc")).toBe("TENANT-ABC");
        });

        it("should remove leading and trailing whitespace", () => {
            expect(normalizeCode("  tenant-abc  ")).toBe("TENANT-ABC");
        });

        it("should preserve numbers and special characters", () => {
            expect(normalizeCode("tenant-123_a")).toBe("TENANT-123_A");
        });
    });

    describe("isNonEmptyString", () => {
        it("should return true for a non-empty string", () => {
            expect(isNonEmptyString("Amdox ERP")).toBe(true);
        });

        it("should return false for an empty string", () => {
            expect(isNonEmptyString("")).toBe(false);
        });

        it("should return false for whitespace-only strings", () => {
            expect(isNonEmptyString("   ")).toBe(false);
        });

        it("should return false for non-string values", () => {
            expect(isNonEmptyString(123)).toBe(false);
            expect(isNonEmptyString(null)).toBe(false);
            expect(isNonEmptyString(undefined)).toBe(false);
            expect(isNonEmptyString({})).toBe(false);
        });
    });

    describe("isValidDate", () => {
        it("should return true for a valid Date object", () => {
            expect(isValidDate(new Date("2026-01-15"))).toBe(true);
        });

        it("should return false for an invalid Date object", () => {
            expect(isValidDate(new Date("invalid-date"))).toBe(false);
        });

        it("should return false for a date string", () => {
            expect(isValidDate("2026-01-15")).toBe(false);
        });

        it("should return false for non-Date values", () => {
            expect(isValidDate(null)).toBe(false);
            expect(isValidDate(undefined)).toBe(false);
            expect(isValidDate(123)).toBe(false);
            expect(isValidDate({})).toBe(false);
        });
    });

    describe("removeUndefinedFields", () => {
        it("should remove properties with undefined values", () => {
            const result = removeUndefinedFields({
                name: "Test User",
                email: "test@example.com",
                role: undefined,
            });

            expect(result).toEqual({
                name: "Test User",
                email: "test@example.com",
            });
        });

        it("should preserve null, false, zero, and empty strings", () => {
            const result = removeUndefinedFields({
                name: "",
                age: 0,
                isActive: false,
                optional: null,
            });

            expect(result).toEqual({
                name: "",
                age: 0,
                isActive: false,
                optional: null,
            });
        });

        it("should return an empty object when all fields are undefined", () => {
            const result = removeUndefinedFields({
                name: undefined,
                email: undefined,
            });

            expect(result).toEqual({});
        });

        it("should return an empty object for an empty input", () => {
            expect(removeUndefinedFields({})).toEqual({});
        });
    });
});
