
import type { Request, Response } from "express";
import {
  createSystemEvent,
  listSystemEvents,
  getSystemEvent,
  processSystemEvent,
  removeSystemEvent,
} from "../../services/notifications/eventService";

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

export const createEventController = async (
  req: Request,
  res: Response
) => {
  try {
    const { tenantId, userId } = getRequestContext(req);

    const event = await createSystemEvent(
      tenantId,
      userId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getEvents = async (
  req: Request,
  res: Response
) => {
  try {
    const { tenantId, userId } = getRequestContext(req);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const filters: {
      eventName?: string;
      source?: string;
      status?: "pending" | "processed" | "failed";
    } = {};

    if (typeof req.query.eventName === "string") {
      filters.eventName = req.query.eventName;
    }

    if (typeof req.query.source === "string") {
      filters.source = req.query.source;
    }

    const allowedStatuses = [
      "pending",
      "processed",
      "failed",
    ] as const;

    if (
      typeof req.query.status === "string" &&
      allowedStatuses.includes(
        req.query.status as (typeof allowedStatuses)[number]
      )
    ) {
      filters.status = req.query.status as (typeof allowedStatuses)[number];
    }

    const result = await listSystemEvents(
      tenantId,
      userId,
      filters,
      page,
      limit
    );

    return res.status(200).json({
      success: true,
      data: result.events,
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

export const getEventByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { tenantId, userId } = getRequestContext(req);

    const event = await getSystemEvent(
      tenantId,
      userId,
      req.params.eventId as string
    );

    return res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const processEventController = async (
  req: Request,
  res: Response
) => {
  try {
    const { tenantId, userId } = getRequestContext(req);

    const result = await processSystemEvent(
      tenantId,
      userId,
      req.params.eventId as string
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteEventController = async (
  req: Request,
  res: Response
) => {
  try {
    const { tenantId, userId } = getRequestContext(req);

    const result = await removeSystemEvent(
      tenantId,
      userId,
      req.params.eventId as string
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
