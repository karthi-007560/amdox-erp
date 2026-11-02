
import { Types } from "mongoose";
import Budget from "../../models/project/Budget";
import Project from "../../models/project/Project";
import { Tenant } from "../../models/Tenant";
import { User } from "../../models/User";

interface CreateBudgetInput {
    projectId: string;
    budgetCode: string;
    name: string;
    description?: string;
    totalAmount: number;
    currency?: string;
    fiscalYear?: string;
}

interface UpdateBudgetInput {
    name?: string;
    description?: string;
    totalAmount?: number;
    spentAmount?: number;
    currency?: string;
    fiscalYear?: string;
    status?: "draft" | "approved" | "active" | "closed";
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

const validateAmount = (amount: number, field: string): void => {
    if (!Number.isFinite(amount) || amount < 0) {
        throw new Error(`${field} must be a valid non-negative amount`);
    }
};

export const createBudget = async (
    tenantId: string,
    createdBy: string,
    input: CreateBudgetInput
) => {
    await validateActiveTenant(tenantId);

    validateObjectId(createdBy, "creator ID");
    await validateProject(tenantId, input.projectId);

    validateAmount(input.totalAmount, "Total amount");

    const creator = await User.findOne({
        _id: createdBy,
        tenantId,
        isActive: true
    }).select("_id");

    if (!creator) {
        throw new Error("Creator not found or inactive");
    }

    return Budget.create({
        ...input,
        tenantId,
        createdBy
    });
};

export const getAllBudgets = async (
    tenantId: string,
    filters: {
        projectId?: string;
        status?: string;
        fiscalYear?: string;
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

    if (filters.fiscalYear) {
        query.fiscalYear = filters.fiscalYear;
    }

    return Budget.find(query)
        .populate("projectId", "projectCode name status")
        .populate("createdBy", "name email")
        .populate("approvedBy", "name email")
        .sort({ createdAt: -1 });
};

export const getBudgetById = async (
    tenantId: string,
    budgetId: string
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(budgetId, "budget ID");

    const budget = await Budget.findOne({
        _id: budgetId,
        tenantId
    })
        .populate("projectId", "projectCode name status")
        .populate("createdBy", "name email")
        .populate("approvedBy", "name email");

    if (!budget) {
        throw new Error("Budget not found");
    }

    return budget;
};

export const updateBudget = async (
    tenantId: string,
    budgetId: string,
    input: UpdateBudgetInput
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(budgetId, "budget ID");

    const budget = await Budget.findOne({
        _id: budgetId,
        tenantId
    });

    if (!budget) {
        throw new Error("Budget not found");
    }

    const totalAmount = input.totalAmount ?? budget.totalAmount;
    const spentAmount = input.spentAmount ?? budget.spentAmount;

    validateAmount(totalAmount, "Total amount");
    validateAmount(spentAmount, "Spent amount");

    if (spentAmount > totalAmount) {
        throw new Error("Spent amount cannot exceed the total budget");
    }

    if (
        input.status === "approved" &&
        budget.status !== "approved"
    ) {
        throw new Error("Use the approveBudget operation to approve a budget");
    }

    Object.assign(budget, input);

    await budget.save();

    return budget;
};

export const approveBudget = async (
    tenantId: string,
    budgetId: string,
    approvedBy: string
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(budgetId, "budget ID");
    validateObjectId(approvedBy, "approver ID");

    const approver = await User.findOne({
        _id: approvedBy,
        tenantId,
        isActive: true,
        role: { $in: ["admin", "manager"] }
    }).select("_id");

    if (!approver) {
        throw new Error("An active admin or manager is required to approve a budget");
    }

    const budget = await Budget.findOne({
        _id: budgetId,
        tenantId
    });

    if (!budget) {
        throw new Error("Budget not found");
    }

    if (budget.status !== "draft") {
        throw new Error("Only draft budgets can be approved");
    }

    budget.status = "approved";
    budget.approvedBy = new Types.ObjectId(approvedBy);
    budget.approvedAt = new Date();

    await budget.save();

    return budget;
};

export const deleteBudget = async (
    tenantId: string,
    budgetId: string
) => {
    await validateActiveTenant(tenantId);
    validateObjectId(budgetId, "budget ID");

    const budget = await Budget.findOne({
        _id: budgetId,
        tenantId
    });

    if (!budget) {
        throw new Error("Budget not found");
    }

    if (budget.status !== "draft") {
        throw new Error("Only draft budgets can be deleted");
    }

    await budget.deleteOne();

    return budget;
};
