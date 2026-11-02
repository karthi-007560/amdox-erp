
import type { Request, Response } from "express";
import {
  createWebhook,
  listWebhooks,
  getWebhookById,
  updateWebhook,
  deleteWebhook,
} from "../../services/notifications/webhookService";

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

export const createWebhookController = async (
  req: Request,
  res: Response
) => {
  try {
    const { tenantId, userId } = getRequestContext(req);

    const webhook = await createWebhook(
      tenantId,
      userId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Webhook created successfully",
      data: webhook,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getWebhooks = async (
  req: Request,
  res: Response
) => {
  try {
    const { tenantId, userId } = getRequestContext(req);

    const webhooks = await listWebhooks(tenantId, userId);

    return res.status(200).json({
      success: true,
      data: webhooks,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getWebhookByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const { tenantId, userId } = getRequestContext(req);

    const webhook = await getWebhookById(
      tenantId,
      userId,
      req.params.webhookId as string
    );

    return res.status(200).json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateWebhookController = async (
  req: Request,
  res: Response
) => {
  try {
    const { tenantId, userId } = getRequestContext(req);

    const webhook = await updateWebhook(
      tenantId,
      userId,
      req.params.webhookId as string,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Webhook updated successfully",
      data: webhook,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteWebhookController = async (
  req: Request,
  res: Response
) => {
  try {
    const { tenantId, userId } = getRequestContext(req);

    const result = await deleteWebhook(
      tenantId,
      userId,
      req.params.webhookId as string
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
