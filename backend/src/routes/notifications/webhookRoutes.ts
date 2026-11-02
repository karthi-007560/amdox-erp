
import { Router } from "express";
import {
  createWebhookController,
  getWebhooks,
  getWebhookByIdController,
  updateWebhookController,
  deleteWebhookController,
} from "../../controllers/notifications/webhookController";
import { authenticateToken, authorizeRoles } from "../../middleware/authMiddleware";
import { tenantContext } from "../../middleware/tenantContext.middleware";

const router = Router();

router.use(authenticateToken, tenantContext);

router.post("/", authorizeRoles("admin", "manager"), createWebhookController);
router.get("/", authorizeRoles("admin", "manager"), getWebhooks);
router.get("/:webhookId", authorizeRoles("admin", "manager"), getWebhookByIdController);
router.patch("/:webhookId", authorizeRoles("admin", "manager"), updateWebhookController);
router.delete("/:webhookId", authorizeRoles("admin", "manager"), deleteWebhookController);

export default router;
