
import { Router } from "express";
import {
    createTaskController,
    getAllTasksController,
    getTaskByIdController,
    updateTaskController,
    deleteTaskController
} from "../../controllers/project/taskController";
import { authenticateToken, authorizeRoles } from "../../middleware/authMiddleware";
import { tenantContext } from "../../middleware/tenantContext.middleware";
import { validateTask } from "../../validators/project.validator";

const router = Router();

router.use(authenticateToken, tenantContext);

router.post(
    "/",
    authorizeRoles("admin", "manager"),
    createTaskController
);

router.get("/", getAllTasksController);

router.get("/:taskId", getTaskByIdController);

router.patch("/:taskId", updateTaskController);

router.delete(
    "/:taskId",
    authorizeRoles("admin", "manager"),
    deleteTaskController
);

router.post("/", authorizeRoles("admin", "manager"), validateTask, createTaskController);

router.patch("/:taskId", validateTask, updateTaskController);

export default router;
