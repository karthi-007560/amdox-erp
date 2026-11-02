
import mongoose, { Schema, type Document, type Types } from "mongoose";

export type WebhookStatus = "active" | "inactive";

export interface IWebhook extends Document {
  tenantId: Types.ObjectId;
  name: string;
  url: string;
  secret: string;
  events: string[];
  status: WebhookStatus;
  createdBy: Types.ObjectId;
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const webhookSchema = new Schema<IWebhook>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    secret: {
      type: String,
      required: true,
      select: false,
    },
    events: {
      type: [String],
      required: true,
      validate: {
        validator: (value: string[]) => value.length > 0,
        message: "At least one webhook event must be selected",
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastTriggeredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

webhookSchema.index({ tenantId: 1, name: 1 }, { unique: true });
webhookSchema.index({ tenantId: 1, status: 1 });

const Webhook =
  mongoose.models.Webhook ||
  mongoose.model<IWebhook>("Webhook", webhookSchema);

export default Webhook;
