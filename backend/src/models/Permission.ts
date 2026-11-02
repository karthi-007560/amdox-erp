
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPermission extends Document {
  tenantId: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  module: string;
  action: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>(
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
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    module: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

permissionSchema.index(
  { tenantId: 1, code: 1 },
  { unique: true }
);

permissionSchema.index({ tenantId: 1, module: 1, action: 1 });

const Permission =
  mongoose.models.Permission ||
  mongoose.model<IPermission>("Permission", permissionSchema);

export default Permission;
