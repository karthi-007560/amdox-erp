
import { Request, Response, NextFunction } from "express";
import {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject
} from "../../services/project/projectService";

export const createProjectController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const project = await createProject(
            req.tenantId!,
            req.auth!.userId,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            data: project
        });
    } catch (error) {
        next(error);
    }
};

export const getAllProjectsController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const projects = await getAllProjects(req.tenantId!, {
            status: req.query.status as string,
            priority: req.query.priority as string,
            projectManager: req.query.projectManager as string,
            search: req.query.search as string
        });

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        next(error);
    }
};

export const getProjectByIdController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const project = await getProjectById(
            req.tenantId!,
            (req.params.projectId as string)
        );

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};

export const updateProjectController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const project = await updateProject(
            req.tenantId!,
            (req.params.projectId as string),
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Project updated successfully",
            data: project
        });
    } catch (error) {
        next(error);
    }
};

export const deleteProjectController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await deleteProject(
            req.tenantId!,
            (req.params.projectId as string)
        );

        res.status(200).json({
            success: true,
            message: "Project deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};
