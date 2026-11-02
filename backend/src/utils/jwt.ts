import jwt, {
    type SignOptions,
} from "jsonwebtoken";

import type {
    UserRole,
    JwtPayload,
} from "../types/auth.js";

import { DEFAULTS } from "./constants.js";

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not configured.");
    }

    return secret;
}

function isUserRole(value: unknown): value is UserRole {
    return (
        value === "admin" ||
        value === "manager" ||
        value === "employee"
    );
}

export function generateToken(
    userId: string,
    role: UserRole,
    expiresIn: SignOptions["expiresIn"] =
        (process.env.JWT_EXPIRES_IN ??
            DEFAULTS.JWT_EXPIRES_IN) as SignOptions["expiresIn"]
): string {
    if (!userId.trim()) {
        throw new Error("User ID is required to generate a token.");
    }

    const secret = getJwtSecret();

    return jwt.sign(
        { role },
        secret,
        {
            subject: userId,
            expiresIn,
        }
    );
}

export function verifyToken(token: string): JwtPayload {
    const secret = getJwtSecret();

    const decoded = jwt.verify(token, secret);

    if (
        typeof decoded === "string" ||
        typeof decoded.sub !== "string" ||
        !isUserRole(decoded.role)
    ) {
        throw new Error("Invalid authentication token payload.");
    }

    return {
        sub: decoded.sub,
        role: decoded.role,
    };
}

export function decodeToken(
    token: string
): JwtPayload | null {
    const decoded = jwt.decode(token);

    if (
        typeof decoded === "string" ||
        !decoded ||
        typeof decoded.sub !== "string" ||
        !isUserRole(decoded.role)
    ) {
        return null;
    }

    return {
        sub: decoded.sub,
        role: decoded.role,
    };
}