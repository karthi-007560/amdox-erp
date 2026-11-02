
import { Router } from "express";
import {
    createRoleController,
    getRoles,
    getRoleByIdController,
    updateRoleController,
    deleteRoleController,
} from "../../controllers/settings/roleController";
import { authenticateToken, authorizeRoles } from "../../middleware/authMiddleware";
import { tenantContext } from "../../middleware/tenantContext.middleware";

const router = Router();

router.use(authenticateToken, tenantContext);

router.post("/", authorizeRoles("admin", "manager"), createRoleController);
router.get("/", authorizeRoles("admin", "manager"), getRoles);
router.get("/:roleId", authorizeRoles("admin", "manager"), getRoleByIdController);
router.patch("/:roleId", authorizeRoles("admin", "manager"), updateRoleController);
router.delete("/:roleId", authorizeRoles("admin"), deleteRoleController);

export default router;
