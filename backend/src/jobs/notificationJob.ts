import { createUserNotification } from "../services/notifications/notificationService.js";

export interface NotificationJobInput {
    tenantId: string;
    userId: string;
    notification: Parameters<
        typeof createUserNotification
    >[2];
}

export interface NotificationJobResult {
    total: number;
    successful: number;
    failed: number;
    errors: string[];
}

export async function runNotificationJob(
    notifications: NotificationJobInput[]
): Promise<NotificationJobResult> {
    const result: NotificationJobResult = {
        total: notifications.length,
        successful: 0,
        failed: 0,
        errors: [],
    };

    for (const item of notifications) {
        try {
            await createUserNotification(
                item.tenantId,
                item.userId,
                item.notification
            );

            result.successful++;
        } catch (error: unknown) {
            result.failed++;

            result.errors.push(
                `Notification failed for user ${item.userId}: ${
                    error instanceof Error
                        ? error.message
                        : String(error)
                }`
            );
        }
    }

    return result;
}