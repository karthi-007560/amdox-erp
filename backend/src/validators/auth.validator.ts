
import type { Request, Response, NextFunction } from "express";

export function validateRegistration(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const { name, email, password } = req.body;

    if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof email !== "string" ||
        !email.trim() ||
        typeof password !== "string" ||
        !password
    ) {
        res.status(400).json({
            success: false,
            message: "Name, email, and password are required.",
        });
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
        res.status(400).json({
            success: false,
            message: "Please provide a valid email address.",
        });
        return;
    }

    if (password.length < 8) {
        res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters long.",
        });
        return;
    }

    next();
}

export function validateLogin(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const { email, password } = req.body;

    if (
        typeof email !== "string" ||
        !email.trim() ||
        typeof password !== "string" ||
        !password
    ) {
        res.status(400).json({
            success: false,
            message: "Email and password are required.",
        });
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
        res.status(400).json({
            success: false,
            message: "Please provide a valid email address.",
        });
        return;
    }

    next();
}
