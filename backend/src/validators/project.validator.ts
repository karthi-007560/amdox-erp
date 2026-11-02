import type { RequestHandler } from "express";
import mongoose from "mongoose";

type FieldType =
    | "string"
    | "number"
    | "date"
    | "enum"
    | "objectId"
    | "objectIdArray"
    | "stringArray";

interface FieldRule {
    type: FieldType;
    required?: boolean;
    values?: string[];
    min?: number;
    max?: number;
    nullable?: boolean;
}

type ValidationRules = Record<string, FieldRule>;

const createValidator = (rules: ValidationRules): RequestHandler => {
    return (req, res, next) => {
        const body = req.body;

        if (!body || typeof body !== "object" || Array.isArray(body)) {
            res.status(400).json({
                success: false,
                message: "Request body must be a valid object"
            });
            return;
        }

        const errors: string[] = [];
        const isCreate = req.method === "POST";

        for (const [field, rule] of Object.entries(rules)) {
            const value = body[field];

            if (value === undefined || value === null || value === "") {
                if (rule.required && isCreate) {
                    errors.push(`${field} is required`);
                } else if (value === null && !rule.nullable && rule.required) {
                    errors.push(`${field} cannot be null`);
                }

                continue;
            }

            switch (rule.type) {
                case "string":
                    if (typeof value !== "string" || !value.trim()) {
                        errors.push(`${field} must be a non-empty string`);
                    }
                    break;

                case "number":
                    if (
                        typeof value !== "number" ||
                        !Number.isFinite(value) ||
                        (rule.min !== undefined && value < rule.min) ||
                        (rule.max !== undefined && value > rule.max)
                    ) {
                        errors.push(`${field} must be a valid number between ${rule.min ?? "-infinity"} and ${rule.max ?? "infinity"}`);
                    }
                    break;

                case "date":
                    if (
                        typeof value !== "string" &&
                        !(value instanceof Date)
                    ) {
                        errors.push(`${field} must be a valid date`);
                    } else if (Number.isNaN(new Date(value).getTime())) {
                        errors.push(`${field} must be a valid date`);
                    }
                    break;

                case "enum":
                    if (
                        typeof value !== "string" ||
                        !rule.values?.includes(value)
                    ) {
                        errors.push(`${field} must be one of: ${rule.values?.join(", ")}`);
                    }
                    break;

                case "objectId":
                    if (
                        typeof value !== "string" ||
                        !mongoose.Types.ObjectId.isValid(value)
                    ) {
                        errors.push(`${field} must be a valid ID`);
                    }
                    break;

                case "objectIdArray":
                    if (
                        !Array.isArray(value) ||
                        !value.every(
                            (id) =>
                                typeof id === "string" &&
                                mongoose.Types.ObjectId.isValid(id)
                        )
                    ) {
                        errors.push(`${field} must be an array of valid IDs`);
                    }
                    break;

                case "stringArray":
                    if (
                        !Array.isArray(value) ||
                        !value.every(
                            (item) =>
                                typeof item === "string" && item.trim().length > 0
                        )
                    ) {
                        errors.push(`${field} must be an array of non-empty strings`);
                    }
                    break;
            }
        }

        if (errors.length > 0) {
            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors
            });
            return;
        }

        next();
    };
};

export const validateProject = createValidator({
    projectCode: { type: "string", required: true },
    name: { type: "string", required: true },
    description: { type: "string" },
    clientName: { type: "string" },
    status: {
        type: "enum",
        values: ["planning", "active", "on-hold", "completed", "cancelled"]
    },
    priority: {
        type: "enum",
        values: ["low", "medium", "high", "critical"]
    },
    startDate: { type: "date" },
    endDate: { type: "date" },
    projectManager: { type: "objectId", nullable: true },
    teamMembers: { type: "objectIdArray" }
});

export const validateTask = createValidator({
    projectId: { type: "objectId", required: true },
    title: { type: "string", required: true },
    description: { type: "string" },
    status: {
        type: "enum",
        values: ["todo", "in-progress", "review", "completed", "blocked"]
    },
    priority: {
        type: "enum",
        values: ["low", "medium", "high", "critical"]
    },
    assignedTo: { type: "objectId", nullable: true },
    startDate: { type: "date" },
    dueDate: { type: "date" },
    estimatedHours: { type: "number", min: 0 },
    actualHours: { type: "number", min: 0 },
    tags: { type: "stringArray" },
    dependencies: { type: "objectIdArray" }
});

export const validateResource = createValidator({
    projectId: { type: "objectId", required: true },
    userId: { type: "objectId", required: true },
    role: { type: "string", required: true },
    allocationPercentage: {
        type: "number",
        required: true,
        min: 1,
        max: 100
    },
    startDate: { type: "date", required: true },
    endDate: { type: "date" },
    hourlyRate: { type: "number", min: 0 },
    currency: { type: "string" },
    status: {
        type: "enum",
        values: ["allocated", "available", "released"]
    }
});

export const validateBudget = createValidator({
    projectId: { type: "objectId", required: true },
    budgetCode: { type: "string", required: true },
    name: { type: "string", required: true },
    description: { type: "string" },
    totalAmount: { type: "number", required: true, min: 0 },
    spentAmount: { type: "number", min: 0 },
    currency: { type: "string" },
    fiscalYear: { type: "number" },
    status: {
        type: "enum",
        values: ["draft", "approved", "active", "closed"]
    }
});