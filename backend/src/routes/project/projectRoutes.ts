
import { Router } from "express";
import {
    createProjectController,
    getAllProjectsController,
    getProjectByIdController,
    updateProjectController,
    deleteProjectController
} from "../../controllers/project/projectController";
import { authenticateToken, authorizeRoles } from "../../middleware/authMiddleware";
import { tenantContext } from "../../middleware/tenantContext.middleware";
import { validateProject } from "../../validators/project.validator";

const router = Router();

router.use(authenticateToken, tenantContext);

router.post(
    "/",
    authorizeRoles("admin", "manager"),
    createProjectController
);

router.get("/", getAllProjectsController);

router.get("/:projectId", getProjectByIdController);

router.patch(
    "/:projectId",
    authorizeRoles("admin", "manager"),
    updateProjectController
);

router.delete(
    "/:projectId",
    authorizeRoles("admin"),
    deleteProjectController
);

router.post("/", authorizeRoles("admin", "manager"), validateProject, createProjectController);

router.patch("/:projectId", authorizeRoles("admin", "manager"), validateProject, updateProjectController);

export default router;
