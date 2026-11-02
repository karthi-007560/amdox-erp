import {
    formatDate,
    formatDateTime,
    startOfDay,
    endOfDay,
    addDays,
    isSameDay,
    isDateInRange,
    getDaysBetween,
} from "../../../src/utils/dateUtils";

describe("Date Utilities", () => {
    describe("formatDate", () => {
        it("should format a valid date", () => {
            const result = formatDate("2026-01-15T12:00:00");
            const expected = new Intl.DateTimeFormat("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }).format(new Date("2026-01-15T12:00:00"));

            expect(result).toBe(expected);
        });

        it("should support a custom locale", () => {
            const result = formatDate("2026-01-15T12:00:00", "en-US");

            expect(result).toBe(
                new Intl.DateTimeFormat("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }).format(new Date("2026-01-15T12:00:00"))
            );
        });

        it("should throw an error for an invalid date", () => {
            expect(() => formatDate("invalid-date")).toThrow("Invalid date.");
        });
    });

    describe("formatDateTime", () => {
        it("should format a valid date and time", () => {
            const input = "2026-01-15T14:30:00";

            const result = formatDateTime(input);
            const expected = new Intl.DateTimeFormat("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }).format(new Date(input));

            expect(result).toBe(expected);
        });

        it("should throw an error for an invalid date", () => {
            expect(() => formatDateTime("invalid-date")).toThrow("Invalid date.");
        });
    });

    describe("startOfDay", () => {
        it("should set the time to the beginning of the day", () => {
            const result = startOfDay("2026-01-15T14:35:42.123");

            expect(result.getHours()).toBe(0);
            expect(result.getMinutes()).toBe(0);
            expect(result.getSeconds()).toBe(0);
            expect(result.getMilliseconds()).toBe(0);
        });

        it("should throw an error for an invalid date", () => {
            expect(() => startOfDay("invalid-date")).toThrow("Invalid date.");
        });
    });

    describe("endOfDay", () => {
        it("should set the time to the end of the day", () => {
            const result = endOfDay("2026-01-15T14:35:42.123");

            expect(result.getHours()).toBe(23);
            expect(result.getMinutes()).toBe(59);
            expect(result.getSeconds()).toBe(59);
            expect(result.getMilliseconds()).toBe(999);
        });

        it("should throw an error for an invalid date", () => {
            expect(() => endOfDay("invalid-date")).toThrow("Invalid date.");
        });
    });

    describe("addDays", () => {
        it("should add days to a date", () => {
            const result = addDays("2026-01-15T12:00:00", 5);

            expect(result.getDate()).toBe(20);
            expect(result.getMonth()).toBe(0);
            expect(result.getFullYear()).toBe(2026);
        });

        it("should subtract days when given a negative number", () => {
            const result = addDays("2026-01-15T12:00:00", -5);

            expect(result.getDate()).toBe(10);
        });

        it("should support adding zero days", () => {
            const result = addDays("2026-01-15T12:00:00", 0);

            expect(result.getDate()).toBe(15);
        });

        it("should throw an error when days is not an integer", () => {
            expect(() => addDays("2026-01-15", 1.5)).toThrow(
                "Days must be an integer."
            );
        });

        it("should throw an error for an invalid date", () => {
            expect(() => addDays("invalid-date", 2)).toThrow("Invalid date.");
        });
    });

    describe("isSameDay", () => {
        it("should return true for dates on the same day", () => {
            expect(
                isSameDay(
                    "2026-01-15T08:00:00",
                    "2026-01-15T20:00:00"
                )
            ).toBe(true);
        });

        it("should return false for dates on different days", () => {
            expect(
                isSameDay("2026-01-15", "2026-01-16")
            ).toBe(false);
        });

        it("should return false when either date is invalid", () => {
            expect(isSameDay("invalid-date", "2026-01-15")).toBe(false);
        });
    });

    describe("isDateInRange", () => {
        const start = "2026-01-10T00:00:00";
        const end = "2026-01-20T23:59:59";

        it("should return true for a date inside the range", () => {
            expect(
                isDateInRange("2026-01-15T12:00:00", start, end)
            ).toBe(true);
        });

        it("should include the start and end boundaries", () => {
            expect(isDateInRange(start, start, end)).toBe(true);
            expect(isDateInRange(end, start, end)).toBe(true);
        });

        it("should return false for a date outside the range", () => {
            expect(
                isDateInRange("2026-01-25T12:00:00", start, end)
            ).toBe(false);
        });

        it("should return false when any date is invalid", () => {
            expect(
                isDateInRange("invalid-date", start, end)
            ).toBe(false);
        });
    });

    describe("getDaysBetween", () => {
        it("should calculate the number of days between dates", () => {
            expect(
                getDaysBetween("2026-01-10", "2026-01-15")
            ).toBe(5);
        });

        it("should return the same positive result for reversed dates", () => {
            expect(
                getDaysBetween("2026-01-15", "2026-01-10")
            ).toBe(5);
        });

        it("should round partial days up", () => {
            expect(
                getDaysBetween(
                    "2026-01-10T00:00:00",
                    "2026-01-11T01:00:00"
                )
            ).toBe(2);
        });

        it("should return zero for identical dates", () => {
            expect(
                getDaysBetween("2026-01-10", "2026-01-10")
            ).toBe(0);
        });

        it("should throw an error when the date range is invalid", () => {
            expect(
                () => getDaysBetween("invalid-date", "2026-01-15")
            ).toThrow("Invalid date range.");
        });
    });
});
