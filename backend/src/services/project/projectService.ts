
import { Types } from "mongoose";
import Project from "../../models/project/Project";
import { Tenant } from "../../models/Tenant";
import { User } from "../../models/User";

interface CreateProjectInput {
    projectCode: string;
    name: string;
    description?: string;
    clientName?: string;
    priority?: "low" | "medium" | "high" | "critical";
    status?: "planning" | "active" | "on-hold" | "completed" | "cancelled";
    startDate?: Date;
    endDate?: Date;
    projectManager?: string;
    teamMembers?: string[];
}

interface UpdateProjectInput {
    name?: string;
    description?: string;
    clientName?: string;
    priority?: "low" | "medium" | "high" | "critical";
    status?: "planning" | "active" | "on-hold" | "completed" | "cancelled";
    startDate?: Date;
    endDate?: Date;
    projectManager?: string | null;
    teamMembers?: string[];
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

const validateTenantUsers = async (
    tenantId: string,
    userIds: string[]
): Promise<void> => {
    const uniqueIds = [...new Set(userIds)];

    uniqueIds.forEach((id) => validateObjectId(id, "user ID"));

    if (uniqueIds.length === 0) return;

    const users = await User.find({
        _id: { $in: uniqueIds },
        tenantId,
        isActive: true
    }).select("_id");

    if (users.length !== uniqueIds.length) {
        throw new Error("One or more users are invalid or inactive");
    }
};

const validateProjectDates = (
    startDate?: Date,
    endDate?: Date
): void => {
    if (startDate && endDate && startDate > endDate) {
        throw new Error("Project end date cannot be before start date");
    }
};

export const createProject = async (
    tenantId: string,
    createdBy: string,
    input: CreateProjectInput
) => {
    await validateActiveTenant(tenantId);

    validateObjectId(createdBy, "creator ID");

    const user = await User.findOne({
        _id: createdBy,
        tenantId,
        isActive: true
    }).select("_id");

    if (!user) {
        throw new Error("Creator not found or inactive");
    }

    const userIds = [
        ...(input.projectManager ? [input.projectManager] : []),
        ...(input.teamMembers || [])
    ];

    await validateTenantUsers(tenantId, userIds);

    validateProjectDates(input.startDate, input.endDate);

    const project = await Project.create({
        ...input,
        tenantId,
        createdBy
    });

    return project;
};

export const getAllProjects = async (
    tenantId: string,
    filters: {
        status?: string;
        priority?: string;
        projectManager?: string;
        search?: string;
    } = {}
) => {
    await validateActiveTenant(tenantId);

    const query: Record<string, unknown> = { tenantId };

    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.priority) {
        query.priority = filters.priority;
    }

    if (filters.projectManager) {
        validateObjectId(filters.projectManager, "project manager ID");
        query.projectManager = filters.projectManager;
    }

    if (filters.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: "i" } },
            { projectCode: { $regex: filters.search, $options: "i" } },
            { clientName: { $regex: filters.search, $options: "i" } }
        ];
    }

    return Project.find(query)
        .populate("projectManager", "name email role")
        .populate("teamMembers", "name email role")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });
};

export const getProjectById = async (
    tenantId: string,
    projectId: string
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(projectId, "project ID");

    const project = await Project.findOne({
        _id: projectId,
        tenantId
    })
        .populate("projectManager", "name email role")
        .populate("teamMembers", "name email role")
        .populate("createdBy", "name email");

    if (!project) {
        throw new Error("Project not found");
    }

    return project;
};

export const updateProject = async (
    tenantId: string,
    projectId: string,
    input: UpdateProjectInput
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(projectId, "project ID");

    const project = await Project.findOne({
        _id: projectId,
        tenantId
    });

    if (!project) {
        throw new Error("Project not found");
    }

    const userIds = [
        ...(input.projectManager ? [input.projectManager] : []),
        ...(input.teamMembers || [])
    ];

    await validateTenantUsers(tenantId, userIds);

    const startDate = input.startDate ?? project.startDate;
    const endDate = input.endDate ?? project.endDate;

    validateProjectDates(startDate, endDate);

    if (input.projectManager === null) {
        project.projectManager = undefined;
    }

    Object.assign(project, {
        ...input,
        ...(input.projectManager === null
            ? { projectManager: undefined }
            : {})
    });

    await project.save();

    return project;
};

export const deleteProject = async (
    tenantId: string,
    projectId: string
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(projectId, "project ID");

    const project = await Project.findOneAndDelete({
        _id: projectId,
        tenantId
    });

    if (!project) {
        throw new Error("Project not found");
    }

    return project;
};
