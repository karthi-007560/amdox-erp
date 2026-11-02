import {
    isValidEmail,
    isValidPhoneNumber,
    isValidObjectId,
    isPositiveNumber,
    isNonNegativeNumber,
    isValidCurrencyCode,
    isValidUrl,
    isValidStringLength,
    isValidDateString,
    isValidPercentage,
    isStrongPassword,
} from "../../../src/utils/validators";

describe("Validation Utilities", () => {
    describe("isValidEmail", () => {
        it("should accept valid email addresses", () => {
            expect(isValidEmail("user@example.com")).toBe(true);
            expect(isValidEmail("first.last@company.co.in")).toBe(true);
            expect(isValidEmail("user+test@example.org")).toBe(true);
        });

        it("should accept an email with surrounding whitespace", () => {
            expect(isValidEmail("  user@example.com  ")).toBe(true);
        });

        it("should reject invalid email addresses", () => {
            expect(isValidEmail("userexample.com")).toBe(false);
            expect(isValidEmail("user@")).toBe(false);
            expect(isValidEmail("@example.com")).toBe(false);
            expect(isValidEmail("user@example")).toBe(false);
            expect(isValidEmail("user name@example.com")).toBe(false);
            expect(isValidEmail("")).toBe(false);
        });
    });

    describe("isValidPhoneNumber", () => {
        it("should accept valid phone numbers", () => {
            expect(isValidPhoneNumber("9876543210")).toBe(true);
            expect(isValidPhoneNumber("+919876543210")).toBe(true);
            expect(isValidPhoneNumber("12345678")).toBe(true);
        });

        it("should accept surrounding whitespace", () => {
            expect(isValidPhoneNumber("  9876543210  ")).toBe(true);
        });

        it("should reject invalid phone numbers", () => {
            expect(isValidPhoneNumber("1234567")).toBe(false);
            expect(isValidPhoneNumber("1234567890123456")).toBe(false);
            expect(isValidPhoneNumber("0123456789")).toBe(false);
            expect(isValidPhoneNumber("+0123456789")).toBe(false);
            expect(isValidPhoneNumber("98765 43210")).toBe(false);
            expect(isValidPhoneNumber("abcdefghij")).toBe(false);
            expect(isValidPhoneNumber("")).toBe(false);
        });
    });

    describe("isValidObjectId", () => {
        it("should accept valid MongoDB ObjectIds", () => {
            expect(isValidObjectId("507f1f77bcf86cd799439011")).toBe(true);
            expect(isValidObjectId("507F1F77BCF86CD799439011")).toBe(true);
        });

        it("should reject invalid ObjectIds", () => {
            expect(isValidObjectId("invalid-id")).toBe(false);
            expect(isValidObjectId("12345")).toBe(false);
            expect(isValidObjectId("507f1f77bcf86cd79943901")).toBe(false);
            expect(isValidObjectId("")).toBe(false);
        });
    });

    describe("isPositiveNumber", () => {
        it("should accept positive finite numbers", () => {
            expect(isPositiveNumber(1)).toBe(true);
            expect(isPositiveNumber(100.5)).toBe(true);
            expect(isPositiveNumber(Number.MIN_VALUE)).toBe(true);
        });

        it("should reject zero, negative, and non-finite numbers", () => {
            expect(isPositiveNumber(0)).toBe(false);
            expect(isPositiveNumber(-1)).toBe(false);
            expect(isPositiveNumber(Infinity)).toBe(false);
            expect(isPositiveNumber(NaN)).toBe(false);
        });

        it("should reject non-number values", () => {
            expect(isPositiveNumber("10")).toBe(false);
            expect(isPositiveNumber(null)).toBe(false);
            expect(isPositiveNumber(undefined)).toBe(false);
            expect(isPositiveNumber(true)).toBe(false);
        });
    });

    describe("isNonNegativeNumber", () => {
        it("should accept zero and positive finite numbers", () => {
            expect(isNonNegativeNumber(0)).toBe(true);
            expect(isNonNegativeNumber(1)).toBe(true);
            expect(isNonNegativeNumber(100.5)).toBe(true);
        });

        it("should reject negative and non-finite numbers", () => {
            expect(isNonNegativeNumber(-1)).toBe(false);
            expect(isNonNegativeNumber(Infinity)).toBe(false);
            expect(isNonNegativeNumber(NaN)).toBe(false);
        });

        it("should reject non-number values", () => {
            expect(isNonNegativeNumber("0")).toBe(false);
            expect(isNonNegativeNumber(null)).toBe(false);
            expect(isNonNegativeNumber(undefined)).toBe(false);
        });
    });

    describe("isValidCurrencyCode", () => {
        it("should accept three-letter currency codes", () => {
            expect(isValidCurrencyCode("INR")).toBe(true);
            expect(isValidCurrencyCode("USD")).toBe(true);
            expect(isValidCurrencyCode("EUR")).toBe(true);
        });

        it("should accept lowercase and mixed-case codes", () => {
            expect(isValidCurrencyCode("inr")).toBe(true);
            expect(isValidCurrencyCode("Usd")).toBe(true);
        });

        it("should accept surrounding whitespace", () => {
            expect(isValidCurrencyCode("  INR  ")).toBe(true);
        });

        it("should reject invalid currency codes", () => {
            expect(isValidCurrencyCode("IN")).toBe(false);
            expect(isValidCurrencyCode("INRR")).toBe(false);
            expect(isValidCurrencyCode("12R")).toBe(false);
            expect(isValidCurrencyCode("I R")).toBe(false);
            expect(isValidCurrencyCode("")).toBe(false);
        });
    });

    describe("isValidUrl", () => {
        it("should accept valid HTTP and HTTPS URLs", () => {
            expect(isValidUrl("https://example.com")).toBe(true);
            expect(isValidUrl("http://example.com")).toBe(true);
            expect(isValidUrl("https://example.com/path?name=test")).toBe(true);
        });

        it("should reject unsupported protocols", () => {
            expect(isValidUrl("ftp://example.com")).toBe(false);
            expect(isValidUrl("file:///home/user/file.txt")).toBe(false);
            expect(isValidUrl("javascript:alert(1)")).toBe(false);
        });

        it("should reject malformed and incomplete URLs", () => {
            expect(isValidUrl("example.com")).toBe(false);
            expect(isValidUrl("not-a-url")).toBe(false);
            expect(isValidUrl("")).toBe(false);
        });
    });

    describe("isValidStringLength", () => {
        it("should accept strings within the allowed length", () => {
            expect(isValidStringLength("Amdox", 2, 10)).toBe(true);
            expect(isValidStringLength("ERP", 3, 3)).toBe(true);
        });

        it("should accept strings exactly at minimum and maximum boundaries", () => {
            expect(isValidStringLength("AB", 2, 5)).toBe(true);
            expect(isValidStringLength("ABCDE", 2, 5)).toBe(true);
        });

        it("should measure the trimmed string length", () => {
            expect(isValidStringLength("  ERP  ", 3, 3)).toBe(true);
        });

        it("should reject strings outside the allowed length", () => {
            expect(isValidStringLength("A", 2, 5)).toBe(false);
            expect(isValidStringLength("TOOLONG", 2, 5)).toBe(false);
        });

        it("should reject invalid length boundaries", () => {
            expect(isValidStringLength("test", -1, 5)).toBe(false);
            expect(isValidStringLength("test", 5, 2)).toBe(false);
            expect(isValidStringLength("test", 1.5, 5)).toBe(false);
            expect(isValidStringLength("test", 1, 5.5)).toBe(false);
        });

        it("should accept an empty string when the minimum length is zero", () => {
            expect(isValidStringLength("", 0, 0)).toBe(true);
        });
    });

    describe("isValidDateString", () => {
        it("should accept valid date strings", () => {
            expect(isValidDateString("2026-01-15")).toBe(true);
            expect(isValidDateString("2026-01-15T10:30:00Z")).toBe(true);
        });

        it("should accept surrounding whitespace around a valid date", () => {
            expect(isValidDateString("  2026-01-15  ")).toBe(true);
        });

        it("should reject empty and whitespace-only strings", () => {
            expect(isValidDateString("")).toBe(false);
            expect(isValidDateString("   ")).toBe(false);
        });

        it("should reject unparseable date strings", () => {
            expect(isValidDateString("not-a-date")).toBe(false);
            expect(isValidDateString("invalid")).toBe(false);
        });
    });

    describe("isValidPercentage", () => {
        it("should accept percentages from zero to one hundred", () => {
            expect(isValidPercentage(0)).toBe(true);
            expect(isValidPercentage(50)).toBe(true);
            expect(isValidPercentage(100)).toBe(true);
            expect(isValidPercentage(25.5)).toBe(true);
        });

        it("should reject values outside the percentage range", () => {
            expect(isValidPercentage(-1)).toBe(false);
            expect(isValidPercentage(100.1)).toBe(false);
        });

        it("should reject non-finite numbers", () => {
            expect(isValidPercentage(Infinity)).toBe(false);
            expect(isValidPercentage(-Infinity)).toBe(false);
            expect(isValidPercentage(NaN)).toBe(false);
        });
    });

    describe("isStrongPassword", () => {
        it("should accept passwords meeting all strength requirements", () => {
            expect(isStrongPassword("Password1!")).toBe(true);
            expect(isStrongPassword("Amdox@2026")).toBe(true);
        });

        it("should reject passwords shorter than eight characters", () => {
            expect(isStrongPassword("Ab1!xyz")).toBe(false);
        });

        it("should reject passwords without an uppercase letter", () => {
            expect(isStrongPassword("password1!")).toBe(false);
        });

        it("should reject passwords without a lowercase letter", () => {
            expect(isStrongPassword("PASSWORD1!")).toBe(false);
        });

        it("should reject passwords without a digit", () => {
            expect(isStrongPassword("Password!")).toBe(false);
        });

        it("should reject passwords without a special character", () => {
            expect(isStrongPassword("Password123")).toBe(false);
        });

        it("should reject an empty password", () => {
            expect(isStrongPassword("")).toBe(false);
        });
    });
});
