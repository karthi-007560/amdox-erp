export const NOTIFICATION_EVENTS = {
    CREATED: "notification.created",
    SENT: "notification.sent",
    READ: "notification.read",
    FAILED: "notification.failed",
} as const;

export interface NotificationEventPayload {
    tenantId: string;
    notificationId: string;
    recipientId?: string;
    channel?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
}

export interface NotificationEventMap {
    [NOTIFICATION_EVENTS.CREATED]: NotificationEventPayload;
    [NOTIFICATION_EVENTS.SENT]: NotificationEventPayload;
    [NOTIFICATION_EVENTS.READ]: NotificationEventPayload;
    [NOTIFICATION_EVENTS.FAILED]: NotificationEventPayload;
}