
import { Router } from "express";
import {
    createIntegrationController,
    getIntegrations,
    getIntegrationByProviderController,
    updateIntegrationController,
    deleteIntegrationController,
} from "../../controllers/settings/integrationController";
import { authenticateToken, authorizeRoles } from "../../middleware/authMiddleware";
import { tenantContext } from "../../middleware/tenantContext.middleware";

const router = Router();

router.use(authenticateToken, tenantContext);

router.post("/", authorizeRoles("admin"), createIntegrationController);
router.get("/", authorizeRoles("admin", "manager"), getIntegrations);
router.get("/:provider", authorizeRoles("admin", "manager"), getIntegrationByProviderController);
router.patch("/:provider", authorizeRoles("admin"), updateIntegrationController);
router.delete("/:provider", authorizeRoles("admin"), deleteIntegrationController);

export default router;
