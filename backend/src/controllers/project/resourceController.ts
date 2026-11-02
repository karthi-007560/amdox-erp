
import { Request, Response, NextFunction } from "express";
import {
    createResource,
    getAllResources,
    getResourceById,
    updateResource,
    deleteResource
} from "../../services/project/resourceService";

export const createResourceController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const resource = await createResource(
            req.tenantId!,
            req.auth!.userId,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Resource allocation created successfully",
            data: resource
        });
    } catch (error) {
        next(error);
    }
};

export const getAllResourcesController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const resources = await getAllResources(req.tenantId!, {
            projectId: req.query.projectId as string,
            userId: req.query.userId as string,
            status: req.query.status as string
        });

        res.status(200).json({
            success: true,
            count: resources.length,
            data: resources
        });
    } catch (error) {
        next(error);
    }
};

export const getResourceByIdController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const resource = await getResourceById(
            req.tenantId!,
            (req.params.resourceId as string)
        );

        res.status(200).json({
            success: true,
            data: resource
        });
    } catch (error) {
        next(error);
    }
};

export const updateResourceController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const resource = await updateResource(
            req.tenantId!,
            (req.params.resourceId as string),
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Resource allocation updated successfully",
            data: resource
        });
    } catch (error) {
        next(error);
    }
};

export const deleteResourceController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await deleteResource(
            req.tenantId!,
            (req.params.resourceId as string)
        );

        res.status(200).json({
            success: true,
            message: "Resource allocation deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};
