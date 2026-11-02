
import { Types } from "mongoose";
import Event from "../../models/notifications/Event";

interface CreateEventData {
  tenantId: Types.ObjectId;
  eventName: string;
  source: string;
  payload?: Record<string, unknown>;
  createdBy?: Types.ObjectId;
}

interface EventFilters {
  eventName?: string;
  source?: string;
  status?: "pending" | "processed" | "failed";
}

export const createEvent = async (data: CreateEventData) => {
  return Event.create(data);
};

export const findEventsByTenant = async (
  tenantId: Types.ObjectId,
  filters: EventFilters = {},
  page = 1,
  limit = 20
) => {
  const query = {
    tenantId,
    ...filters,
  };

  const [events, total] = await Promise.all([
    Event.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Event.countDocuments(query),
  ]);

  return {
    events,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const findEventById = async (
  tenantId: Types.ObjectId,
  eventId: string
) => {
  if (!Types.ObjectId.isValid(eventId)) {
    return null;
  }

  return Event.findOne({
    _id: eventId,
    tenantId,
  });
};

export const updateEventStatus = async (
  tenantId: Types.ObjectId,
  eventId: string,
  status: "pending" | "processed" | "failed",
  errorMessage?: string
) => {
  if (!Types.ObjectId.isValid(eventId)) {
    return null;
  }

  const update: Record<string, unknown> = {
    status,
    processedAt: status === "processed" ? new Date() : undefined,
    errorMessage: status === "failed" ? errorMessage : undefined,
  };

  return Event.findOneAndUpdate(
    {
      _id: eventId,
      tenantId,
    },
    { $set: update },
    { new: true, runValidators: true }
  );
};

export const deleteEvent = async (
  tenantId: Types.ObjectId,
  eventId: string
) => {
  if (!Types.ObjectId.isValid(eventId)) {
    return null;
  }

  return Event.findOneAndDelete({
    _id: eventId,
    tenantId,
  });
};
