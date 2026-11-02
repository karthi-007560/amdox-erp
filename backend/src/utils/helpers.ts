export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function normalizeCode(code: string): string {
    return code.trim().toUpperCase();
}

export function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

export function isValidDate(value: unknown): value is Date {
    return value instanceof Date && !Number.isNaN(value.getTime());
}

export function removeUndefinedFields<T extends Record<string, unknown>>(
    data: T
): Partial<T> {
    return Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
    ) as Partial<T>;
}