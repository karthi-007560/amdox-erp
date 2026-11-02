import { Router } from "express";
import {
    createDashboardController,
    getAllDashboardsController,
    getDashboardByIdController,
    updateDashboardController,
    deleteDashboardController,
    getDashboardOverviewController
} from "../../controllers/dashboard/dashboardController";
import {
    authenticateToken,
    authorizeRoles
} from "../../middleware/authMiddleware";
import { tenantContext } from "../../middleware/tenantContext.middleware";

const router = Router();

router.use(authenticateToken, tenantContext);

router.post(
    "/",
    authorizeRoles("admin", "manager", "employee"),
    createDashboardController
);

router.get("/", getAllDashboardsController);

router.get("/:dashboardId", getDashboardByIdController);

router.get("/:dashboardId/overview", getDashboardOverviewController);

router.patch("/:dashboardId", updateDashboardController);

router.delete("/:dashboardId", deleteDashboardController);

export default router;