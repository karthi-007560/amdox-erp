import {
    toNumber,
    formatCurrency,
    convertCurrency,
    roundCurrency,
    calculatePercentage,
    calculateTax,
} from "../../../src/utils/currencyUtils";

describe("Currency Utilities", () => {
    describe("toNumber", () => {
        it("should convert a numeric string into a number", () => {
            expect(toNumber("1250.50")).toBe(1250.5);
        });

        it("should accept a number", () => {
            expect(toNumber(500)).toBe(500);
        });

        it("should support objects with a toString method", () => {
            expect(toNumber({ toString: () => "250.75" })).toBe(250.75);
        });

        it("should throw an error for invalid numeric values", () => {
            expect(() => toNumber("invalid")).toThrow(
                "Invalid numeric value."
            );
        });

        it("should reject Infinity", () => {
            expect(() => toNumber(Infinity)).toThrow(
                "Invalid numeric value."
            );
        });

        it("should reject NaN", () => {
            expect(() => toNumber(NaN)).toThrow(
                "Invalid numeric value."
            );
        });
    });

    describe("formatCurrency", () => {
        it("should format INR using the default locale", () => {
            const result = formatCurrency(1500);

            expect(result).toBe(
                new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                }).format(1500)
            );
        });

        it("should support a custom currency code", () => {
            const result = formatCurrency(100, "USD", "en-US");

            expect(result).toBe(
                new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                }).format(100)
            );
        });

        it("should accept numeric strings", () => {
            const result = formatCurrency("2500.50");

            expect(result).toBe(
                new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                }).format(2500.5)
            );
        });

        it("should throw an error for an invalid amount", () => {
            expect(() => formatCurrency("invalid")).toThrow(
                "Invalid numeric value."
            );
        });
    });

    describe("convertCurrency", () => {
        it("should convert an amount using the exchange rate", () => {
            expect(convertCurrency(100, 83.5)).toBe(8350);
        });

        it("should accept numeric strings", () => {
            expect(convertCurrency("100", "2")).toBe(200);
        });

        it("should throw an error when the exchange rate is zero", () => {
            expect(() => convertCurrency(100, 0)).toThrow(
                "Exchange rate must be greater than zero."
            );
        });

        it("should throw an error when the exchange rate is negative", () => {
            expect(() => convertCurrency(100, -2)).toThrow(
                "Exchange rate must be greater than zero."
            );
        });

        it("should reject an invalid exchange rate", () => {
            expect(() => convertCurrency(100, "invalid")).toThrow(
                "Invalid numeric value."
            );
        });
    });

    describe("roundCurrency", () => {
        it("should round an amount to two decimal places by default", () => {
            expect(roundCurrency(123.456)).toBe(123.46);
        });

        it("should support custom decimal places", () => {
            expect(roundCurrency(123.4567, 3)).toBe(123.457);
        });

        it("should support zero decimal places", () => {
            expect(roundCurrency(123.6, 0)).toBe(124);
        });

        it("should support ten decimal places", () => {
            expect(roundCurrency(1.12345678912, 10)).toBe(1.1234567891);
        });

        it("should reject negative decimal places", () => {
            expect(() => roundCurrency(100, -1)).toThrow(
                "Decimal places must be between 0 and 10."
            );
        });

        it("should reject decimal places greater than ten", () => {
            expect(() => roundCurrency(100, 11)).toThrow(
                "Decimal places must be between 0 and 10."
            );
        });

        it("should reject non-integer decimal places", () => {
            expect(() => roundCurrency(100, 2.5)).toThrow(
                "Decimal places must be between 0 and 10."
            );
        });

        it("should reject invalid amounts", () => {
            expect(() => roundCurrency("invalid")).toThrow(
                "Invalid numeric value."
            );
        });
    });

    describe("calculatePercentage", () => {
        it("should calculate a percentage correctly", () => {
            expect(calculatePercentage(1000, 10)).toBe(100);
        });

        it("should support numeric strings", () => {
            expect(calculatePercentage("500", "20")).toBe(100);
        });

        it("should return zero for zero percent", () => {
            expect(calculatePercentage(1000, 0)).toBe(0);
        });

        it("should support decimal percentages", () => {
            expect(calculatePercentage(1000, 7.5)).toBe(75);
        });

        it("should reject invalid numeric values", () => {
            expect(() => calculatePercentage("invalid", 10)).toThrow(
                "Invalid numeric value."
            );
        });
    });

    describe("calculateTax", () => {
        it("should calculate tax and round to two decimal places", () => {
            expect(calculateTax(1000, 18)).toBe(180);
        });

        it("should round tax calculations correctly", () => {
            expect(calculateTax(199.99, 18)).toBe(36);
        });

        it("should support numeric strings", () => {
            expect(calculateTax("500", "5")).toBe(25);
        });

        it("should return zero when the tax rate is zero", () => {
            expect(calculateTax(1000, 0)).toBe(0);
        });

        it("should reject invalid numeric values", () => {
            expect(() => calculateTax("invalid", 18)).toThrow(
                "Invalid numeric value."
            );
        });
    });
});
