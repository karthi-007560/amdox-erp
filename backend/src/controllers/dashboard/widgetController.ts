import type { Request, Response, NextFunction } from "express";
import {
    createWidget,
    getAllWidgets,
    getWidgetById,
    updateWidget,
    deleteWidget
} from "../../services/dashboard/widgetService";

export const createWidgetController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const widget = await createWidget(
            req.tenantId!,
            req.auth!.userId,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Widget created successfully",
            data: widget
        });
    } catch (error) {
        next(error);
    }
};

export const getAllWidgetsController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const widgets = await getAllWidgets(
            req.tenantId!,
            req.auth!.userId,
            req.query.dashboardId as string
        );

        res.status(200).json({
            success: true,
            data: widgets
        });
    } catch (error) {
        next(error);
    }
};

export const getWidgetByIdController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const widget = await getWidgetById(
            req.tenantId!,
            req.auth!.userId,
            req.params.widgetId as string
        );

        res.status(200).json({
            success: true,
            data: widget
        });
    } catch (error) {
        next(error);
    }
};

export const updateWidgetController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const widget = await updateWidget(
            req.tenantId!,
            req.auth!.userId,
            req.params.widgetId as string,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Widget updated successfully",
            data: widget
        });
    } catch (error) {
        next(error);
    }
};

export const deleteWidgetController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await deleteWidget(
            req.tenantId!,
            req.auth!.userId,
            req.params.widgetId as string
        );

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};