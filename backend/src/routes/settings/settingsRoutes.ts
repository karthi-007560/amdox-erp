
import { Router } from "express";
import {
    getSettings,
    updateSettings,
    resetSettings,
} from "../../controllers/settings/settingsController";
import { authenticateToken } from "../../middleware/authMiddleware";
import { tenantContext } from "../../middleware/tenantContext.middleware";
import { authorizeRoles } from "../../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken, tenantContext);

router.get("/", authorizeRoles("admin", "manager"), getSettings);
router.patch("/", authorizeRoles("admin"), updateSettings);
router.post("/reset", authorizeRoles("admin"), resetSettings);

export default router;
