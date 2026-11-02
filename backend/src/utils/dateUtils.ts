export function formatDate(
    date: Date | string,
    locale = "en-IN"
): string {
    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
        throw new Error("Invalid date.");
    }

    return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(value);
}

export function formatDateTime(
    date: Date | string,
    locale = "en-IN"
): string {
    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
        throw new Error("Invalid date.");
    }

    return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(value);
}

export function startOfDay(date: Date | string): Date {
    const result = new Date(date);

    if (Number.isNaN(result.getTime())) {
        throw new Error("Invalid date.");
    }

    result.setHours(0, 0, 0, 0);
    return result;
}

export function endOfDay(date: Date | string): Date {
    const result = new Date(date);

    if (Number.isNaN(result.getTime())) {
        throw new Error("Invalid date.");
    }

    result.setHours(23, 59, 59, 999);
    return result;
}

export function addDays(
    date: Date | string,
    days: number
): Date {
    if (!Number.isInteger(days)) {
        throw new Error("Days must be an integer.");
    }

    const result = new Date(date);

    if (Number.isNaN(result.getTime())) {
        throw new Error("Invalid date.");
    }

    result.setDate(result.getDate() + days);
    return result;
}

export function isSameDay(
    first: Date | string,
    second: Date | string
): boolean {
    const a = new Date(first);
    const b = new Date(second);

    if (
        Number.isNaN(a.getTime()) ||
        Number.isNaN(b.getTime())
    ) {
        return false;
    }

    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export function isDateInRange(
    date: Date | string,
    startDate: Date | string,
    endDate: Date | string
): boolean {
    const value = new Date(date).getTime();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    if (
        !Number.isFinite(value) ||
        !Number.isFinite(start) ||
        !Number.isFinite(end)
    ) {
        return false;
    }

    return value >= start && value <= end;
}

export function getDaysBetween(
    startDate: Date | string,
    endDate: Date | string
): number {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    if (
        !Number.isFinite(start) ||
        !Number.isFinite(end)
    ) {
        throw new Error("Invalid date range.");
    }

    return Math.ceil(
        Math.abs(end - start) / (1000 * 60 * 60 * 24)
    );
}