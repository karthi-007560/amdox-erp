export const AUDIT_EVENTS = {
    CREATED: "audit.created",
    UPDATED: "audit.updated",
    DELETED: "audit.deleted",
    ACCESSED: "audit.accessed",
} as const;

export interface AuditEventPayload {
    tenantId: string;
    actorId: string;
    action: string;
    entity: string;
    entityId: string;
    changes?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export interface AuditEventMap {
    [AUDIT_EVENTS.CREATED]: AuditEventPayload;
    [AUDIT_EVENTS.UPDATED]: AuditEventPayload;
    [AUDIT_EVENTS.DELETED]: AuditEventPayload;
    [AUDIT_EVENTS.ACCESSED]: AuditEventPayload;
}