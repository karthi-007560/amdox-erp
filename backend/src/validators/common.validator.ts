
import type { Request, Response, NextFunction } from "express";

export function validateTenantCreation(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const { name, code } = req.body ?? {};

    if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof code !== "string" ||
        !code.trim()
    ) {
        res.status(400).json({
            success: false,
            message: "Tenant name and code are required.",
        });
        return;
    }

    const trimmedName = name.trim();
    const trimmedCode = code.trim();

    if (trimmedName.length > 150) {
        res.status(400).json({
            success: false,
            message: "Tenant name cannot exceed 150 characters.",
        });
        return;
    }

    if (trimmedCode.length > 30) {
        res.status(400).json({
            success: false,
            message: "Tenant code cannot exceed 30 characters.",
        });
        return;
    }

    const codeRegex = /^[A-Za-z0-9_-]+$/;

    if (!codeRegex.test(trimmedCode)) {
        res.status(400).json({
            success: false,
            message:
                "Tenant code can contain only letters, numbers, underscores, and hyphens.",
        });
        return;
    }

    next();
}
