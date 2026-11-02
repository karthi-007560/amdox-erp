import type { Request, Response, NextFunction } from "express";
import {
    createReport,
    getAllReports,
    getReportById,
    updateReport,
    deleteReport
} from "../../services/dashboard/reportService";

export const createReportController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const report = await createReport(
            req.tenantId!,
            req.auth!.userId,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Report created successfully",
            data: report
        });
    } catch (error) {
        next(error);
    }
};

export const getAllReportsController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const reports = await getAllReports(
            req.tenantId!,
            req.auth!.userId,
            {
                type: req.query.type as never,
                status: req.query.status as never
            }
        );

        res.status(200).json({
            success: true,
            data: reports
        });
    } catch (error) {
        next(error);
    }
};

export const getReportByIdController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const report = await getReportById(
            req.tenantId!,
            req.auth!.userId,
            req.params.reportId as string
        );

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

export const updateReportController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const report = await updateReport(
            req.tenantId!,
            req.auth!.userId,
            req.params.reportId as string,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Report updated successfully",
            data: report
        });
    } catch (error) {
        next(error);
    }
};

export const deleteReportController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const result = await deleteReport(
            req.tenantId!,
            req.auth!.userId,
            req.params.reportId as string
        );

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        next(error);
    }
};