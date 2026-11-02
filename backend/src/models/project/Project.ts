
import mongoose, { Schema, type Document, type Types } from "mongoose";

export type ProjectStatus =
    | "planning"
    | "active"
    | "on-hold"
    | "completed"
    | "cancelled";

export type ProjectPriority =
    | "low"
    | "medium"
    | "high"
    | "critical";

export interface IProject extends Document {
    tenantId: Types.ObjectId;
    projectCode: string;
    name: string;
    description?: string;
    clientName?: string;
    status: ProjectStatus;
    priority: ProjectPriority;
    startDate?: Date;
    endDate?: Date;
    projectManager?: Types.ObjectId;
    teamMembers: Types.ObjectId[];
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },

        projectCode: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            maxlength: 50,
        },

        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 2000,
        },

        clientName: {
            type: String,
            trim: true,
            maxlength: 150,
        },

        status: {
            type: String,
            enum: [
                "planning",
                "active",
                "on-hold",
                "completed",
                "cancelled",
            ],
            default: "planning",
            required: true,
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium",
            required: true,
        },

        startDate: {
            type: Date,
        },

        endDate: {
            type: Date,
        },

        projectManager: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        teamMembers: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                },
            ],
            default: [],
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);


projectSchema.index(
    { tenantId: 1, projectCode: 1 },
    { unique: true }
);


projectSchema.index(
    { tenantId: 1, status: 1, createdAt: -1 }
);

projectSchema.index(
    { tenantId: 1, projectManager: 1 }
);

const Project =
    mongoose.models.Project ||
    mongoose.model<IProject>("Project", projectSchema);

export default Project;
