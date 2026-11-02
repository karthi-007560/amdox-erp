
import Event from "../models/notifications/Event.js";
import Notification from "../models/notifications/Notification.js";

interface DataCleanupJobResult {
    startedAt: Date;
    completedAt: Date;
    pendingEvents: number;
    processedEvents: number;
    failedEvents: number;
    unreadNotifications: number;
    readNotifications: number;
    deletedRecords: number;
    message: string;
}

export async function runDataCleanupJob(): Promise<DataCleanupJobResult> {
    const startedAt = new Date();

    const [
        pendingEvents,
        processedEvents,
        failedEvents,
        unreadNotifications,
        readNotifications,
    ] = await Promise.all([
        Event.countDocuments({ status: "pending" }),
        Event.countDocuments({ status: "processed" }),
        Event.countDocuments({ status: "failed" }),
        Notification.countDocuments({ isRead: false }),
        Notification.countDocuments({ isRead: true }),
    ]);

    return {
        startedAt,
        completedAt: new Date(),
        pendingEvents,
        processedEvents,
        failedEvents,
        unreadNotifications,
        readNotifications,
        deletedRecords: 0,
        message:
            "Cleanup inspection completed. No records were deleted because retention policies are not configured.",
    };
}
