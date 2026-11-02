
import { Request, Response, NextFunction } from "express";
import {
    createBudget,
    getAllBudgets,
    getBudgetById,
    updateBudget,
    approveBudget,
    deleteBudget
} from "../../services/project/budgetService";

export const createBudgetController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const budget = await createBudget(
            req.tenantId!,
            req.auth!.userId,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Budget created successfully",
            data: budget
        });
    } catch (error) {
        next(error);
    }
};

export const getAllBudgetsController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const budgets = await getAllBudgets(req.tenantId!, {
            projectId: req.query.projectId as string,
            status: req.query.status as string,
            fiscalYear: req.query.fiscalYear as string
        });

        res.status(200).json({
            success: true,
            count: budgets.length,
            data: budgets
        });
    } catch (error) {
        next(error);
    }
};

export const getBudgetByIdController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const budget = await getBudgetById(
            req.tenantId!,
            (req.params.budgetId as string)
        );

        res.status(200).json({
            success: true,
            data: budget
        });
    } catch (error) {
        next(error);
    }
};

export const updateBudgetController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const budget = await updateBudget(
            req.tenantId!,
            (req.params.budgetId as string),
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Budget updated successfully",
            data: budget
        });
    } catch (error) {
        next(error);
    }
};

export const approveBudgetController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const budget = await approveBudget(
            req.tenantId!,
            (req.params.budgetId as string),
            req.auth!.userId
        );

        res.status(200).json({
            success: true,
            message: "Budget approved successfully",
            data: budget
        });
    } catch (error) {
        next(error);
    }
};

export const deleteBudgetController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await deleteBudget(
            req.tenantId!,
            (req.params.budgetId as string)
        );

        res.status(200).json({
            success: true,
            message: "Budget deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};
