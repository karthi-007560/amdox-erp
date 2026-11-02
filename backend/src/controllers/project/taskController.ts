
import { Request, Response, NextFunction } from "express";
import {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask
} from "../../services/project/taskService";

export const createTaskController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const task = await createTask(
            req.tenantId!,
            req.auth!.userId,
            req.body
        );

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            data: task
        });
    } catch (error) {
        next(error);
    }
};

export const getAllTasksController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const tasks = await getAllTasks(req.tenantId!, {
            projectId: req.query.projectId as string,
            status: req.query.status as string,
            priority: req.query.priority as string,
            assignedTo: req.query.assignedTo as string,
            search: req.query.search as string
        });

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        next(error);
    }
};

export const getTaskByIdController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const task = await getTaskById(
            req.tenantId!,
            (req.params.taskId as string)
        );

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

export const updateTaskController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const task = await updateTask(
            req.tenantId!,
            (req.params.taskId as string),
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            data: task
        });
    } catch (error) {
        next(error);
    }
};

export const deleteTaskController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        await deleteTask(
            req.tenantId!,
            (req.params.taskId as string)
        );

        res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};
