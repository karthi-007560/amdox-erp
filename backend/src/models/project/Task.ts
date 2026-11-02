
import mongoose, { Schema, type Document, type Types } from "mongoose";

export type TaskStatus =
    | "todo"
    | "in-progress"
    | "review"
    | "completed"
    | "blocked";

export type TaskPriority =
    | "low"
    | "medium"
    | "high"
    | "critical";

export interface ITask extends Document {
    tenantId: Types.ObjectId;
    projectId: Types.ObjectId;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignedTo?: Types.ObjectId;
    createdBy: Types.ObjectId;
    startDate?: Date;
    dueDate?: Date;
    completedAt?: Date;
    estimatedHours?: number;
    actualHours?: number;
    tags: string[];
    dependencies: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        description: {
            type: String,
            trim: true,
            maxlength: 3000
        },
        status: {
            type: String,
            enum: ["todo", "in-progress", "review", "completed", "blocked"],
            default: "todo",
            required: true
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium",
            required: true
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        startDate: {
            type: Date
        },
        dueDate: {
            type: Date
        },
        completedAt: {
            type: Date
        },
        estimatedHours: {
            type: Number,
            min: 0
        },
        actualHours: {
            type: Number,
            min: 0
        },
        tags: {
            type: [String],
            default: []
        },
        dependencies: {
            type: [{ type: Schema.Types.ObjectId, ref: "Task" }],
            default: []
        }
    },
    { timestamps: true }
);

taskSchema.index({ tenantId: 1, projectId: 1, status: 1 });
taskSchema.index({ tenantId: 1, assignedTo: 1, dueDate: 1 });
taskSchema.index({ tenantId: 1, createdAt: -1 });

const Task =
    mongoose.models.Task || mongoose.model<ITask>("Task", taskSchema);

export default Task;
