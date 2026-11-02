import { Router } from "express";
import {
    createWidgetController,
    getAllWidgetsController,
    getWidgetByIdController,
    updateWidgetController,
    deleteWidgetController
} from "../../controllers/dashboard/widgetController";
import {
    authenticateToken,
    authorizeRoles
} from "../../middleware/authMiddleware";
import { tenantContext } from "../../middleware/tenantContext.middleware";

const router = Router();

router.use(authenticateToken, tenantContext);

router.post(
    "/",
    authorizeRoles("admin", "manager"),
    createWidgetController
);

router.get("/", getAllWidgetsController);

router.get("/:widgetId", getWidgetByIdController);

router.patch(
    "/:widgetId",
    authorizeRoles("admin", "manager"),
    updateWidgetController
);

router.delete(
    "/:widgetId",
    authorizeRoles("admin", "manager"),
    deleteWidgetController
);

export default router;
