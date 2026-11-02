
import { Router } from "express";
import {
    createResourceController,
    getAllResourcesController,
    getResourceByIdController,
    updateResourceController,
    deleteResourceController
} from "../../controllers/project/resourceController";
import { authenticateToken, authorizeRoles } from "../../middleware/authMiddleware";
import { tenantContext } from "../../middleware/tenantContext.middleware";
import { validateResource } from "../../validators/project.validator";

const router = Router();

router.use(authenticateToken, tenantContext);

router.post(
    "/",
    authorizeRoles("admin", "manager"),
    createResourceController
);

router.get("/", getAllResourcesController);

router.get("/:resourceId", getResourceByIdController);

router.patch(
    "/:resourceId",
    authorizeRoles("admin", "manager"),
    updateResourceController
);

router.delete(
    "/:resourceId",
    authorizeRoles("admin"),
    deleteResourceController
);

router.post("/", authorizeRoles("admin", "manager"), validateResource, createResourceController);

router.patch("/:resourceId", authorizeRoles("admin", "manager"), validateResource, updateResourceController);

export default router;
