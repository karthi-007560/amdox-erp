import { Types } from "mongoose";

export function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
    );
}

export function isValidPhoneNumber(phone: string): boolean {
    return /^\+?[1-9]\d{7,14}$/.test(
        phone.trim()
    );
}

export function isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id);
}

export function isPositiveNumber(value: unknown): boolean {
    return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value > 0
    );
}

export function isNonNegativeNumber(value: unknown): boolean {
    return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0
    );
}

export function isValidCurrencyCode(code: string): boolean {
    return /^[A-Z]{3}$/.test(code.trim().toUpperCase());
}

export function isValidUrl(value: string): boolean {
    try {
        const url = new URL(value);

        return (
            url.protocol === "http:" ||
            url.protocol === "https:"
        );
    } catch {
        return false;
    }
}

export function isValidStringLength(
    value: string,
    minLength: number,
    maxLength: number
): boolean {
    if (
        !Number.isInteger(minLength) ||
        !Number.isInteger(maxLength) ||
        minLength < 0 ||
        maxLength < minLength
    ) {
        return false;
    }

    const length = value.trim().length;

    return length >= minLength && length <= maxLength;
}

export function isValidDateString(value: string): boolean {
    if (!value.trim()) {
        return false;
    }

    const date = new Date(value);

    return !Number.isNaN(date.getTime());
}

export function isValidPercentage(value: number): boolean {
    return (
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 100
    );
}

export function isStrongPassword(password: string): boolean {
    return (
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password) &&
        /[^A-Za-z0-9]/.test(password)
    );
}