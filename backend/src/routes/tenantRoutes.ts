import { Router } from "express";
import { validateTenantCreation } from "../validators/common.validator";
import {
    createTenantController,
    getTenantController,
    getAllTenantsController,
    assignUserToTenantController,
    updateTenantController,
} from "../controllers/tenantController";
import {
    authenticateToken,
    authorizeRoles,
} from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.post("/",authorizeRoles("admin"),validateTenantCreation,createTenantController);
router.get("/",authorizeRoles("admin"),getAllTenantsController);
router.get("/:tenantId",authorizeRoles("admin"),getTenantController);
router.patch("/assign-user",authorizeRoles("admin"),assignUserToTenantController);
router.patch("/:tenantId",authorizeRoles("admin"),updateTenantController);

export default router;
