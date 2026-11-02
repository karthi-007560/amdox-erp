
import { Types } from "mongoose";
import { Tenant } from "../../models/Tenant";
import { User } from "../../models/User";
import {
  createNotification,
  findNotificationsByUser,
  findNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  countUnreadNotifications,
} from "../../repositories/notifications/notificationRepository";

interface CreateNotificationInput {
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

const validateTenantAndUser = async (
  tenantId: string,
  userId: string
) => {
  if (
    !Types.ObjectId.isValid(tenantId) ||
    !Types.ObjectId.isValid(userId)
  ) {
    throw new Error("Invalid tenant or user ID");
  }

  const tenantObjectId = new Types.ObjectId(tenantId);
  const userObjectId = new Types.ObjectId(userId);

  const [tenant, user] = await Promise.all([
    Tenant.findOne({
      _id: tenantObjectId,
      status: "active",
    }),
    User.findOne({
      _id: userObjectId,
      tenantId: tenantObjectId,
      isActive: true,
    }),
  ]);

  if (!tenant) {
    throw new Error("Active tenant not found");
  }

  if (!user) {
    throw new Error("Active user not found in this tenant");
  }

  return { tenantObjectId, userObjectId };
};

export const createUserNotification = async (
  tenantId: string,
  userId: string,
  input: CreateNotificationInput
) => {
  const { tenantObjectId, userObjectId } =
    await validateTenantAndUser(tenantId, userId);

  return createNotification({
    tenantId: tenantObjectId,
    userId: userObjectId,
    ...input,
  });
};

export const listUserNotifications = async (
  tenantId: string,
  userId: string,
  filters: NotificationFilters = {},
  page = 1,
  limit = 20
) => {
  const { tenantObjectId, userObjectId } =
    await validateTenantAndUser(tenantId, userId);

  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));

  return findNotificationsByUser(
    tenantObjectId,
    userObjectId,
    filters,
    safePage,
    safeLimit
  );
};

export const getUserNotification = async (
  tenantId: string,
  userId: string,
  notificationId: string
) => {
  const { tenantObjectId, userObjectId } =
    await validateTenantAndUser(tenantId, userId);

  const notification = await findNotificationById(
    tenantObjectId,
    userObjectId,
    notificationId
  );

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
};

export const markUserNotificationRead = async (
  tenantId: string,
  userId: string,
  notificationId: string
) => {
  const { tenantObjectId, userObjectId } =
    await validateTenantAndUser(tenantId, userId);

  const notification = await markNotificationAsRead(
    tenantObjectId,
    userObjectId,
    notificationId
  );

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
};

export const markAllUserNotificationsRead = async (
  tenantId: string,
  userId: string
) => {
  const { tenantObjectId, userObjectId } =
    await validateTenantAndUser(tenantId, userId);

  return markAllNotificationsAsRead(
    tenantObjectId,
    userObjectId
  );
};

export const removeUserNotification = async (
  tenantId: string,
  userId: string,
  notificationId: string
) => {
  const { tenantObjectId, userObjectId } =
    await validateTenantAndUser(tenantId, userId);

  const notification = await deleteNotification(
    tenantObjectId,
    userObjectId,
    notificationId
  );

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
};

export const getUserUnreadNotificationCount = async (
  tenantId: string,
  userId: string
) => {
  const { tenantObjectId, userObjectId } =
    await validateTenantAndUser(tenantId, userId);

  return countUnreadNotifications(
    tenantObjectId,
    userObjectId
  );
};
