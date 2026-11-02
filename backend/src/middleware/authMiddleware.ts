
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { User } from "../models/User";



export async function authenticateToken(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                message: "Authentication token is required.",
            });
            return;
        }

        const token = authHeader.slice(7);
        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            console.error("JWT_SECRET is not configured.");

            res.status(500).json({
                success: false,
                message: "Authentication configuration error.",
            });
            return;
        }

        const decoded = jwt.verify(token, jwtSecret);

        if (
            typeof decoded === "string" ||
            typeof decoded.sub !== "string"
        ) {
            res.status(401).json({
                success: false,
                message: "Invalid authentication token.",
            });
            return;
        }

        const user = await User.findById(decoded.sub).select(
            "_id role isActive"
        );

        if (!user || !user.isActive) {
            res.status(401).json({
                success: false,
                message: "User is not authorized to access this resource.",
            });
            return;
        }

        req.auth = {
            userId: user._id.toString(),
            role: user.role,
        };

        next();
    } catch (error: unknown) {
        if (
            error instanceof jwt.JsonWebTokenError ||
            error instanceof jwt.TokenExpiredError
        ) {
            res.status(401).json({
                success: false,
                message: "Invalid or expired authentication token.",
            });
            return;
        }

        console.error("Authentication middleware error:", error);

        res.status(500).json({
            success: false,
            message: "An unexpected authentication error occurred.",
        });
    }
}

export function authorizeRoles(...allowedRoles: string[]) {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ): void => {
        if (!req.auth) {
            res.status(401).json({
                success: false,
                message: "Authentication is required.",
            });
            return;
        }

        if (!allowedRoles.includes(req.auth.role)) {
            res.status(403).json({
                success: false,
                message: "You do not have permission to access this resource.",
            });
            return;
        }

        next();
    };
}
