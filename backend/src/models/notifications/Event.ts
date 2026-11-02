
import mongoose, { Schema, type Document, type Types } from "mongoose";

export type EventStatus = "pending" | "processed" | "failed";

export interface IEvent extends Document {
  tenantId: Types.ObjectId;
  eventName: string;
  source: string;
  payload: Record<string, unknown>;
  status: EventStatus;
  processedAt?: Date;
  errorMessage?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    eventName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    source: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
      index: true,
    },
    processedAt: {
      type: Date,
    },
    errorMessage: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

eventSchema.index({ tenantId: 1, eventName: 1, createdAt: -1 });
eventSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

const Event =
  mongoose.models.Event ||
  mongoose.model<IEvent>("Event", eventSchema);

export default Event;
