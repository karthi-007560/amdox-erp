
import { Types } from "mongoose";
import Resource from "../../models/project/Resource";
import Project from "../../models/project/Project";
import { Tenant } from "../../models/Tenant";
import { User } from "../../models/User";

interface CreateResourceInput {
    projectId: string;
    userId: string;
    role: string;
    allocationPercentage: number;
    startDate: Date;
    endDate?: Date;
    hourlyRate?: number;
    currency?: string;
    status?: "allocated" | "available" | "released";
}

interface UpdateResourceInput {
    role?: string;
    allocationPercentage?: number;
    startDate?: Date;
    endDate?: Date | null;
    hourlyRate?: number;
    currency?: string;
    status?: "allocated" | "available" | "released";
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

const validateDates = (startDate: Date, endDate?: Date): void => {
    if (endDate && startDate > endDate) {
        throw new Error("Resource end date cannot be before start date");
    }
};

const validateAllocation = (percentage: number): void => {
    if (!Number.isFinite(percentage) || percentage < 1 || percentage > 100) {
        throw new Error("Allocation percentage must be between 1 and 100");
    }
};

export const createResource = async (
    tenantId: string,
    createdBy: string,
    input: CreateResourceInput
) => {
    await validateActiveTenant(tenantId);

    validateObjectId(createdBy, "creator ID");

    await validateProject(tenantId, input.projectId);
    await validateUser(tenantId, input.userId);
    await validateAllocation(input.allocationPercentage);
    validateDates(input.startDate, input.endDate);

    const creator = await User.findOne({
        _id: createdBy,
        tenantId,
        isActive: true
    }).select("_id");

    if (!creator) {
        throw new Error("Creator not found or inactive");
    }

    const overlappingResource = await Resource.findOne({
        tenantId,
        projectId: input.projectId,
        userId: input.userId,
        status: "allocated",
        startDate: { $lte: input.endDate || new Date("9999-12-31") },
        $or: [
            { endDate: null },
            { endDate: { $exists: false } },
            { endDate: { $gte: input.startDate } }
        ]
    });

    if (overlappingResource) {
        throw new Error("This user already has a resource allocation for the project during this period");
    }

    return Resource.create({
        ...input,
        tenantId,
        createdBy
    });
};

export const getAllResources = async (
    tenantId: string,
    filters: {
        projectId?: string;
        userId?: string;
        status?: string;
    } = {}
) => {
    await validateActiveTenant(tenantId);

    const query: Record<string, unknown> = { tenantId };

    if (filters.projectId) {
        await validateProject(tenantId, filters.projectId);
        query.projectId = filters.projectId;
    }

    if (filters.userId) {
        validateObjectId(filters.userId, "user ID");
        query.userId = filters.userId;
    }

    if (filters.status) {
        query.status = filters.status;
    }

    return Resource.find(query)
        .populate("projectId", "projectCode name status")
        .populate("userId", "name email role")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 });
};

export const getResourceById = async (
    tenantId: string,
    resourceId: string
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(resourceId, "resource ID");

    const resource = await Resource.findOne({
        _id: resourceId,
        tenantId
    })
        .populate("projectId", "projectCode name status")
        .populate("userId", "name email role")
        .populate("createdBy", "name email");

    if (!resource) {
        throw new Error("Resource allocation not found");
    }

    return resource;
};

export const updateResource = async (
    tenantId: string,
    resourceId: string,
    input: UpdateResourceInput
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(resourceId, "resource ID");

    const resource = await Resource.findOne({
        _id: resourceId,
        tenantId
    });

    if (!resource) {
        throw new Error("Resource allocation not found");
    }

    const startDate = input.startDate ?? resource.startDate;
    const endDate = input.endDate === null ? undefined : input.endDate ?? resource.endDate;

    validateDates(startDate, endDate);

    if (input.allocationPercentage !== undefined) {
        validateAllocation(input.allocationPercentage);
    }

    if (
        input.status === "allocated" &&
        resource.status !== "allocated"
    ) {
        const overlappingResource = await Resource.findOne({
            _id: { $ne: resourceId },
            tenantId,
            projectId: resource.projectId,
            userId: resource.userId,
            status: "allocated",
            startDate: { $lte: endDate || new Date("9999-12-31") },
            $or: [
                { endDate: null },
                { endDate: { $exists: false } },
                { endDate: { $gte: startDate } }
            ]
        });

        if (overlappingResource) {
            throw new Error("This user already has an overlapping allocation for the project");
        }
    }

    Object.assign(resource, {
        ...input,
        ...(input.endDate === null ? { endDate: undefined } : {})
    });

    await resource.save();

    return resource;
};

export const deleteResource = async (
    tenantId: string,
    resourceId: string
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(resourceId, "resource ID");

    const resource = await Resource.findOneAndDelete({
        _id: resourceId,
        tenantId
    });

    if (!resource) {
        throw new Error("Resource allocation not found");
    }

    return resource;
};
