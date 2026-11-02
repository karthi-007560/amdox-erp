
import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRole extends Document {
  tenantId: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  permissions: Types.ObjectId[];
  isSystemRole: boolean;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
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
      uppercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

roleSchema.index({ tenantId: 1, code: 1 }, { unique: true });
roleSchema.index({ tenantId: 1, isActive: 1 });

const Role =
  mongoose.models.Role || mongoose.model<IRole>("Role", roleSchema);

export default Role;
