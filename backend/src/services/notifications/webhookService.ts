
import crypto from "crypto";
import { Types } from "mongoose";
import { Tenant } from "../../models/Tenant";
import { User } from "../../models/User";
import Webhook from "../../models/notifications/Webhook";

interface CreateWebhookInput {
  name: string;
  url: string;
  secret: string;
  events: string[];
}

interface UpdateWebhookInput {
  name?: string;
  url?: string;
  secret?: string;
  events?: string[];
  status?: "active" | "inactive";
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
    Tenant.findOne({ _id: tenantObjectId, status: "active" }),
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

const validateWebhookUrl = (value: string) => {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error("Invalid webhook URL");
  }

  if (parsedUrl.protocol !== "https:") {
    throw new Error("Webhook URL must use HTTPS");
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error("Webhook URL must not contain credentials");
  }

  if (parsedUrl.port && parsedUrl.port !== "443") {
    throw new Error("Webhook URL must use the standard HTTPS port");
  }

  const allowedHosts = (process.env.WEBHOOK_ALLOWED_HOSTS || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  if (allowedHosts.length === 0) {
    throw new Error("Webhook hostname allowlist is not configured");
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  const isAllowed = allowedHosts.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`)
  );

  if (!isAllowed) {
    throw new Error("Webhook hostname is not allowed");
  }

  return parsedUrl.toString();
};

export const createWebhook = async (
  tenantId: string,
  userId: string,
  input: CreateWebhookInput
) => {
  const { tenantObjectId, userObjectId } =
    await validateTenantAndUser(tenantId, userId);

  if (!input.secret || input.secret.length < 32) {
    throw new Error("Webhook secret must contain at least 32 characters");
  }

  const url = validateWebhookUrl(input.url);

  const events = [...new Set(input.events.map((event) => event.trim()))];

  if (events.length === 0 || events.some((event) => !event)) {
    throw new Error("At least one valid webhook event is required");
  }

  return Webhook.create({
    tenantId: tenantObjectId,
    createdBy: userObjectId,
    name: input.name,
    url,
    secret: input.secret,
    events,
  });
};

export const listWebhooks = async (tenantId: string, userId: string) => {
  const { tenantObjectId } = await validateTenantAndUser(
    tenantId,
    userId
  );

  return Webhook.find({ tenantId: tenantObjectId }).select("-secret");
};

export const getWebhookById = async (
  tenantId: string,
  userId: string,
  webhookId: string
) => {
  const { tenantObjectId } = await validateTenantAndUser(
    tenantId,
    userId
  );

  if (!Types.ObjectId.isValid(webhookId)) {
    throw new Error("Invalid webhook ID");
  }

  const webhook = await Webhook.findOne({
    _id: webhookId,
    tenantId: tenantObjectId,
  }).select("-secret");

  if (!webhook) {
    throw new Error("Webhook not found");
  }

  return webhook;
};

export const updateWebhook = async (
  tenantId: string,
  userId: string,
  webhookId: string,
  input: UpdateWebhookInput
) => {
  const { tenantObjectId } = await validateTenantAndUser(
    tenantId,
    userId
  );

  if (!Types.ObjectId.isValid(webhookId)) {
    throw new Error("Invalid webhook ID");
  }

  const update: Record<string, unknown> = { ...input };

  if (input.url !== undefined) {
    update.url = validateWebhookUrl(input.url);
  }

  if (input.secret !== undefined && input.secret.length < 32) {
    throw new Error("Webhook secret must contain at least 32 characters");
  }

  if (input.events !== undefined) {
    const events = [...new Set(input.events.map((event) => event.trim()))];

    if (events.length === 0 || events.some((event) => !event)) {
      throw new Error("At least one valid webhook event is required");
    }

    update.events = events;
  }

  const webhook = await Webhook.findOneAndUpdate(
    { _id: webhookId, tenantId: tenantObjectId },
    { $set: update },
    { new: true, runValidators: true }
  ).select("-secret");

  if (!webhook) {
    throw new Error("Webhook not found");
  }

  return webhook;
};

export const deleteWebhook = async (
  tenantId: string,
  userId: string,
  webhookId: string
) => {
  const { tenantObjectId } = await validateTenantAndUser(
    tenantId,
    userId
  );

  if (!Types.ObjectId.isValid(webhookId)) {
    throw new Error("Invalid webhook ID");
  }

  const webhook = await Webhook.findOneAndDelete({
    _id: webhookId,
    tenantId: tenantObjectId,
  });

  if (!webhook) {
    throw new Error("Webhook not found");
  }

  return { message: "Webhook deleted successfully" };
};

export const deliverWebhookEvent = async (
  tenantId: string,
  eventName: string,
  payload: Record<string, unknown>
) => {
  if (!Types.ObjectId.isValid(tenantId)) {
    throw new Error("Invalid tenant ID");
  }

  const webhooks = await Webhook.find({
    tenantId: new Types.ObjectId(tenantId),
    status: "active",
    events: eventName,
  }).select("+secret");

  const results = await Promise.allSettled(
    webhooks.map(async (webhook) => {
      const url = validateWebhookUrl(webhook.url);
      const body = JSON.stringify({
        event: eventName,
        tenantId,
        timestamp: new Date().toISOString(),
        data: payload,
      });

      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(body)
        .digest("hex");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": `sha256=${signature}`,
            "X-Webhook-Event": eventName,
          },
          body,
          signal: controller.signal,
          redirect: "error",
        });

        if (!response.ok) {
          throw new Error(`Webhook delivery failed with status ${response.status}`);
        }

        await Webhook.updateOne(
          { _id: webhook._id, tenantId: webhook.tenantId },
          { $set: { lastTriggeredAt: new Date() } }
        );

        return {
          webhookId: webhook._id,
          success: true,
          status: response.status,
        };
      } finally {
        clearTimeout(timeout);
      }
    })
  );

  return results.map((result, index) => ({
    webhookId: webhooks[index]._id,
    ...(result.status === "fulfilled"
      ? result.value
      : {
          success: false,
          error:
            result.reason instanceof Error
              ? result.reason.message
              : "Webhook delivery failed",
        }),
  }));
};
