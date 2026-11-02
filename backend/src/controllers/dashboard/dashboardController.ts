import type { Request, Response, NextFunction } from "express";
import {
    createDashboard,
    getAllDashboards,
    getDashboardById,
    updateDashboard,
    deleteDashboard,
    getDashboardOverview
} from "../../services/dashboard/dashboardService";

export const createDashboardController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const dashboard = await createDashboard(
            req.tenantId!,
            req.auth!.userId,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Dashboard created successfully",
            data: dashboard
        });
    } catch (error) {
        next(error);
    }
};

export const getAllDashboardsController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const dashboards = await getAllDashboards(
            req.tenantId!,
            req.auth!.userId
        );

        res.status(200).json({
            success: true,
            data: dashboards
        });
    } catch (error) {
        next(error);
    }
};

export const getDashboardByIdController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const dashboard = await getDashboardById(
            req.tenantId!,
            req.auth!.userId,
            req.params.dashboardId as string
        );

        res.status(200).json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        next(error);
    }
};

export const updateDashboardController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const dashboard = await updateDashboard(
            req.tenantId!,
            req.auth!.userId,
            req.params.dashboardId as string,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Dashboard updated successfully",
            data: dashboard
        });
    } catch (error) {
        next(error);
    }
};

export const deleteDashboardController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await deleteDashboard(
            req.tenantId!,
            req.auth!.userId,
            req.params.dashboardId as string
        );

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};

export const getDashboardOverviewController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const overview = await getDashboardOverview(
            req.tenantId!,
            req.auth!.userId,
            req.params.dashboardId as string
        );

        res.status(200).json({
            success: true,
            data: overview
        });
    } catch (error) {
        next(error);
    }
};