
import { Types } from "mongoose";
import Task from "../../models/project/Task";
import Project from "../../models/project/Project";
import { Tenant } from "../../models/Tenant";
import { User } from "../../models/User";

interface CreateTaskInput {
    projectId: string;
    title: string;
    description?: string;
    status?: "todo" | "in-progress" | "review" | "completed" | "blocked";
    priority?: "low" | "medium" | "high" | "critical";
    assignedTo?: string;
    startDate?: Date;
    dueDate?: Date;
    estimatedHours?: number;
    actualHours?: number;
    tags?: string[];
    dependencies?: string[];
}

interface UpdateTaskInput {
    title?: string;
    description?: string;
    status?: "todo" | "in-progress" | "review" | "completed" | "blocked";
    priority?: "low" | "medium" | "high" | "critical";
    assignedTo?: string | null;
    startDate?: Date;
    dueDate?: Date;
    estimatedHours?: number;
    actualHours?: number;
    tags?: string[];
    dependencies?: string[];
}

const validateObjectId = (id: string, field: string): void => {
    if (!Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ${field}`);
    }
};

const validateActiveTenant = async (tenantId: string) => {
    validateObjectId(tenantId, "tenant ID");

    const tenant = await Tenant.findOne({
        _id: tenantId,
        status: "active"
    });

    if (!tenant) {
        throw new Error("Active tenant not found");
    }

    return tenant;
};

const validateProject = async (
    tenantId: string,
    projectId: string
) => {
    validateObjectId(projectId, "project ID");

    const project = await Project.findOne({
        _id: projectId,
        tenantId
    });

    if (!project) {
        throw new Error("Project not found");
    }

    return project;
};

const validateUser = async (
    tenantId: string,
    userId: string
) => {
    validateObjectId(userId, "user ID");

    const user = await User.findOne({
        _id: userId,
        tenantId,
        isActive: true
    }).select("_id");

    if (!user) {
        throw new Error("User not found or inactive");
    }
};

const validateTaskDates = (
    startDate?: Date,
    dueDate?: Date
): void => {
    if (startDate && dueDate && startDate > dueDate) {
        throw new Error("Task due date cannot be before its start date");
    }
};

const validateDependencies = async (
    tenantId: string,
    taskIds: string[],
    currentTaskId?: string
): Promise<void> => {
    const uniqueIds = [...new Set(taskIds)];

    uniqueIds.forEach((id) => validateObjectId(id, "dependency ID"));

    if (currentTaskId && uniqueIds.includes(currentTaskId)) {
        throw new Error("A task cannot depend on itself");
    }

    if (uniqueIds.length === 0) return;

    const tasks = await Task.find({
        _id: { $in: uniqueIds },
        tenantId
    }).select("_id");

    if (tasks.length !== uniqueIds.length) {
        throw new Error("One or more dependency tasks were not found");
    }
};

export const createTask = async (
    tenantId: string,
    createdBy: string,
    input: CreateTaskInput
) => {
    await validateActiveTenant(tenantId);

    validateObjectId(createdBy, "creator ID");

    const creator = await User.findOne({
        _id: createdBy,
        tenantId,
        isActive: true
    }).select("_id");

    if (!creator) {
        throw new Error("Creator not found or inactive");
    }

    await validateProject(tenantId, input.projectId);

    if (input.assignedTo) {
        await validateUser(tenantId, input.assignedTo);
    }

    validateTaskDates(input.startDate, input.dueDate);

    if (input.dependencies) {
        await validateDependencies(tenantId, input.dependencies);
    }

    const task = await Task.create({
        ...input,
        tenantId,
        createdBy
    });

    return task;
};

export const getAllTasks = async (
    tenantId: string,
    filters: {
        projectId?: string;
        status?: string;
        priority?: string;
        assignedTo?: string;
        search?: string;
    } = {}
) => {
    await validateActiveTenant(tenantId);

    const query: Record<string, unknown> = { tenantId };

    if (filters.projectId) {
        await validateProject(tenantId, filters.projectId);
        query.projectId = filters.projectId;
    }

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.priority) {
        query.priority = filters.priority;
    }

    if (filters.assignedTo) {
        validateObjectId(filters.assignedTo, "assignee ID");
        query.assignedTo = filters.assignedTo;
    }

    if (filters.search) {
        query.$or = [
            { title: { $regex: filters.search, $options: "i" } },
            { description: { $regex: filters.search, $options: "i" } }
        ];
    }

    return Task.find(query)
        .populate("projectId", "projectCode name status")
        .populate("assignedTo", "name email role")
        .populate("createdBy", "name email")
        .populate("dependencies", "title status")
        .sort({ createdAt: -1 });
};

export const getTaskById = async (
    tenantId: string,
    taskId: string
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(taskId, "task ID");

    const task = await Task.findOne({
        _id: taskId,
        tenantId
    })
        .populate("projectId", "projectCode name status")
        .populate("assignedTo", "name email role")
        .populate("createdBy", "name email")
        .populate("dependencies", "title status");

    if (!task) {
        throw new Error("Task not found");
    }

    return task;
};

export const updateTask = async (
    tenantId: string,
    taskId: string,
    input: UpdateTaskInput
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(taskId, "task ID");

    const task = await Task.findOne({
        _id: taskId,
        tenantId
    });

    if (!task) {
        throw new Error("Task not found");
    }

    if (input.assignedTo) {
        await validateUser(tenantId, input.assignedTo);
    }

    const startDate = input.startDate ?? task.startDate;
    const dueDate = input.dueDate ?? task.dueDate;

    validateTaskDates(startDate, dueDate);

    if (input.dependencies) {
        await validateDependencies(
            tenantId,
            input.dependencies,
            taskId
        );
    }

    if (input.assignedTo === null) {
        task.assignedTo = undefined;
    }

    if (input.status === "completed" && task.status !== "completed") {
        task.completedAt = new Date();
    } else if (input.status && input.status !== "completed") {
        task.completedAt = undefined;
    }

    Object.assign(task, {
        ...input,
        ...(input.assignedTo === null ? { assignedTo: undefined } : {})
    });

    await task.save();

    return task;
};

export const deleteTask = async (
    tenantId: string,
    taskId: string
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(taskId, "task ID");

    const task = await Task.findOneAndDelete({
        _id: taskId,
        tenantId
    });

    if (!task) {
        throw new Error("Task not found");
    }

    return task;
};
