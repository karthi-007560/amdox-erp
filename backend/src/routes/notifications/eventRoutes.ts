
import { Router } from "express";
import {
  createEventController,
  getEvents,
  getEventByIdController,
  processEventController,
  deleteEventController,
} from "../../controllers/notifications/eventController";
import { authenticateToken, authorizeRoles } from "../../middleware/authMiddleware";
import { tenantContext } from "../../middleware/tenantContext.middleware";

const router = Router();

router.use(authenticateToken, tenantContext);

router.post("/", authorizeRoles("admin", "manager"), createEventController);
router.get("/", authorizeRoles("admin", "manager"), getEvents);
router.get("/:eventId", authorizeRoles("admin", "manager"), getEventByIdController);
router.post("/:eventId/process", authorizeRoles("admin", "manager"), processEventController);
router.delete("/:eventId", authorizeRoles("admin"), deleteEventController);

export default router;
