
import type { Request, Response } from "express";
import {
  createUserNotification,
  listUserNotifications,
  getUserNotification,
  markUserNotificationRead,
  markAllUserNotificationsRead,
  removeUserNotification,
  getUserUnreadNotificationCount,
} from "../../services/notifications/notificationService";

const getRequestContext = (req: Request) => {
  const tenantId = req.tenantId;
  const userId = req.auth?.userId;

  if (!tenantId || !userId) {
    throw new Error("Authentication and tenant context are required");
  }

  return { tenantId, userId };
};

const handleError = (res: Response, error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Internal server error";

  const status = message.includes("not found")
    ? 404
    : message.includes("required")
      ? 401
      : 400;

  return res.status(status).json({
    success: false,
    message,
  });
};

export const createNotification = async (
  req: Request,
  res: Response
) => {
  try {
    const { tenantId, userId } = getRequestContext(req);

    const notification = await createUserNotification(
      tenantId,
      userId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getNotifications = async (
  req: Request,
  res: Response
) => {
  try {
    const { tenantId, userId } = getRequestContext(req);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const filters: {
      isRead?: boolean;
      type?: "info" | "success" | "warning" | "error" | "system";
      channel?: "in-app" | "email" | "sms";
    } = {};

    if (req.query.isRead === "true") {
      filters.isRead = true;
    } else if (req.query.isRead === "false") {
      filters.isRead = false;
    }

    const allowedTypes = [
      "info",
      "success",
      "warning",
      "error",
      "system",
    ] as const;

    const allowedChannels = ["in-app", "email", "sms"] as const;

    if (
      typeof req.query.type === "string" &&
      allowedTypes.includes(req.query.type as (typeof allowedTypes)[number])
    ) {
      filters.type = req.query.type as (typeof allowedTypes)[number];
    }

    if (
      typeof req.query.channel === "string" &&
      allowedChannels.includes(
        req.query.channel as (typeof allowedChannels)[number]
      )
    ) {
      filters.channel = req.query.channel as (typeof allowedChannels)[number];
    }

    const result = await listUserNotifications(
      tenantId,
      userId,
      filters,
      page,
      limit
    );

    return res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getNotificationById = async (
  req: Request,
  res: Response
) => {
  try {
    const { tenantId, userId } = getRequestContext(req);

    const notification = await getUserNotification(
      tenantId,
      userId,
      req.params.notificationId as string
    );

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const markNotificationRead = async (
  req: Request,
  res: Response
) => {
  try {
    const { tenantId, userId } = getRequestContext(req);

    const notification = await markUserNotificationRead(
      tenantId,
      userId,
      req.params.notificationId as string
    );

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const markAllNotificationsRead = async (
  req: Request,
  res: Response
) => {
  try {
    const { tenantId, userId } = getRequestContext(req);

    const result = await markAllUserNotificationsRead(
      tenantId,
      userId
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getUnreadNotificationCount = async (
  req: Request,
  res: Response
) => {
  try {
    const { tenantId, userId } = getRequestContext(req);

    const count = await getUserUnreadNotificationCount(
      tenantId,
      userId
    );

    return res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteNotification = async (
  req: Request,
  res: Response
) => {
  try {
    const { tenantId, userId } = getRequestContext(req);

    await removeUserNotification(
      tenantId,
      userId,
      req.params.notificationId as string
    );

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    return handleError(res, error);
  }
};
