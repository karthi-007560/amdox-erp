
import { Router } from "express";
import {
  createNotification,
  getNotifications,
  getNotificationById,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
  deleteNotification,
} from "../../controllers/notifications/notificationController";
import { authenticateToken } from "../../middleware/authMiddleware";
import { tenantContext } from "../../middleware/tenantContext.middleware";

const router = Router();

router.use(authenticateToken, tenantContext);

router.post("/", createNotification);
router.get("/", getNotifications);
router.get("/unread-count", getUnreadNotificationCount);
router.patch("/read-all", markAllNotificationsRead);
router.get("/:notificationId", getNotificationById);
router.patch("/:notificationId/read", markNotificationRead);
router.delete("/:notificationId", deleteNotification);

export default router;
