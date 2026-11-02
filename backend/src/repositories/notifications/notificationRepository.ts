
import { Types } from "mongoose";
import Notification from "../../models/notifications/Notification";

interface CreateNotificationData {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error" | "system";
  channel?: "in-app" | "email" | "sms";
  metadata?: Record<string, unknown>;
}

interface NotificationFilters {
  isRead?: boolean;
  type?: "info" | "success" | "warning" | "error" | "system";
  channel?: "in-app" | "email" | "sms";
}

export const createNotification = async (
  data: CreateNotificationData
) => {
  return Notification.create(data);
};

export const findNotificationsByUser = async (
  tenantId: Types.ObjectId,
  userId: Types.ObjectId,
  filters: NotificationFilters = {},
  page = 1,
  limit = 20
) => {
  const query = Notification.find({
    tenantId,
    userId,
    ...filters,
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const [notifications, total] = await Promise.all([
    query,
    Notification.countDocuments({
      tenantId,
      userId,
      ...filters,
    }),
  ]);

  return {
    notifications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const findNotificationById = async (
  tenantId: Types.ObjectId,
  userId: Types.ObjectId,
  notificationId: string
) => {
  if (!Types.ObjectId.isValid(notificationId)) {
    return null;
  }

  return Notification.findOne({
    _id: notificationId,
    tenantId,
    userId,
  });
};

export const markNotificationAsRead = async (
  tenantId: Types.ObjectId,
  userId: Types.ObjectId,
  notificationId: string
) => {
  if (!Types.ObjectId.isValid(notificationId)) {
    return null;
  }

  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      tenantId,
      userId,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    },
    { new: true, runValidators: true }
  );
};

export const markAllNotificationsAsRead = async (
  tenantId: Types.ObjectId,
  userId: Types.ObjectId
) => {
  return Notification.updateMany(
    {
      tenantId,
      userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );
};

export const deleteNotification = async (
  tenantId: Types.ObjectId,
  userId: Types.ObjectId,
  notificationId: string
) => {
  if (!Types.ObjectId.isValid(notificationId)) {
    return null;
  }

  return Notification.findOneAndDelete({
    _id: notificationId,
    tenantId,
    userId,
  });
};

export const countUnreadNotifications = async (
  tenantId: Types.ObjectId,
  userId: Types.ObjectId
) => {
  return Notification.countDocuments({
    tenantId,
    userId,
    isRead: false,
  });
};
