import { Types } from "mongoose";
import Event from "../../models/notifications/Event.js";

export interface AuditInput {
    tenantId: string;
    userId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    changes?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export async function recordAuditEvent(input: AuditInput) {
    if (!Types.ObjectId.isValid(input.tenantId)) {
        throw new Error("A valid tenant ID is required.");
    }

    if (input.userId && !Types.ObjectId.isValid(input.userId)) {
        throw new Error("Invalid audit user ID.");
    }

    if (!input.action.trim() || !input.resourceType.trim()) {
        throw new Error("Audit action and resource type are required.");
    }

    return Event.create({
        tenantId: new Types.ObjectId(input.tenantId),
        ...(input.userId
            ? { createdBy: new Types.ObjectId(input.userId) }
            : {}),
        eventName: input.action.trim(),
        source: "audit",
        payload: {
            resourceType: input.resourceType,
            ...(input.resourceId
                ? { resourceId: input.resourceId }
                : {}),
            changes: input.changes ?? {},
            metadata: input.metadata ?? {},
        },
        status: "processed",
        processedAt: new Date(),
    });
}