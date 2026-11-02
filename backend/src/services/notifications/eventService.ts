
import { Types } from "mongoose";
import { Tenant } from "../../models/Tenant";
import { User } from "../../models/User";
import {
  createEvent,
  findEventsByTenant,
  findEventById,
  updateEventStatus,
  deleteEvent,
} from "../../repositories/notifications/eventRepository";
import { deliverWebhookEvent } from "./webhookService";

interface CreateEventInput {
  eventName: string;
  source: string;
  payload?: Record<string, unknown>;
}

interface EventFilters {
  eventName?: string;
  source?: string;
  status?: "pending" | "processed" | "failed";
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

export const createSystemEvent = async (
  tenantId: string,
  userId: string,
  input: CreateEventInput
) => {
  const { tenantObjectId, userObjectId } =
    await validateTenantAndUser(tenantId, userId);

  const event = await createEvent({
    tenantId: tenantObjectId,
    createdBy: userObjectId,
    eventName: input.eventName,
    source: input.source,
    payload: input.payload || {},
  });

  return event;
};

export const listSystemEvents = async (
  tenantId: string,
  userId: string,
  filters: EventFilters = {},
  page = 1,
  limit = 20
) => {
  const { tenantObjectId } = await validateTenantAndUser(
    tenantId,
    userId
  );

  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));

  return findEventsByTenant(
    tenantObjectId,
    filters,
    safePage,
    safeLimit
  );
};

export const getSystemEvent = async (
  tenantId: string,
  userId: string,
  eventId: string
) => {
  const { tenantObjectId } = await validateTenantAndUser(
    tenantId,
    userId
  );

  const event = await findEventById(tenantObjectId, eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  return event;
};

export const processSystemEvent = async (
  tenantId: string,
  userId: string,
  eventId: string
) => {
  const { tenantObjectId } = await validateTenantAndUser(
    tenantId,
    userId
  );

  const event = await findEventById(tenantObjectId, eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  if (event.status === "processed") {
    throw new Error("Event has already been processed");
  }

  try {
    const webhookResults = await deliverWebhookEvent(
      tenantObjectId.toString(),
      event.eventName,
      event.payload || {}
    );

    const failedDeliveries = webhookResults.filter(
      (result) => !result.success
    );

    if (failedDeliveries.length > 0) {
      throw new Error(
        `${failedDeliveries.length} webhook delivery(s) failed`
      );
    }

    await updateEventStatus(
      tenantObjectId,
      eventId,
      "processed"
    );

    return {
      message: "Event processed successfully",
      eventId,
      webhookResults,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Event processing failed";

    await updateEventStatus(
      tenantObjectId,
      eventId,
      "failed",
      errorMessage
    );

    throw error;
  }
};

export const removeSystemEvent = async (
  tenantId: string,
  userId: string,
  eventId: string
) => {
  const { tenantObjectId } = await validateTenantAndUser(
    tenantId,
    userId
  );

  const event = await deleteEvent(tenantObjectId, eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  return {
    message: "Event deleted successfully",
  };
};
