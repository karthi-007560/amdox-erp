
import { Router } from "express";
import {
    createPermissionController,
    getPermissions,
    getPermissionByIdController,
    updatePermissionController,
    deletePermissionController,
} from "../../controllers/settings/permissionController";
import { authenticateToken, authorizeRoles } from "../../middleware/authMiddleware";
import { tenantContext } from "../../middleware/tenantContext.middleware";

const router = Router();

router.use(authenticateToken, tenantContext);

router.post("/", authorizeRoles("admin", "manager"), createPermissionController);
router.get("/", authorizeRoles("admin", "manager"), getPermissions);
router.get("/:permissionId", authorizeRoles("admin", "manager"), getPermissionByIdController);
router.patch("/:permissionId", authorizeRoles("admin", "manager"), updatePermissionController);
router.delete("/:permissionId", authorizeRoles("admin"), deletePermissionController);

export default router;
