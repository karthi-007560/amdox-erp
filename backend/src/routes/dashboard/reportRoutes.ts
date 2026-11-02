import { Router } from "express";
import {
    createReportController,
    getAllReportsController,
    getReportByIdController,
    updateReportController,
    deleteReportController
} from "../../controllers/dashboard/reportController";
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
    createReportController
);

router.get("/", getAllReportsController);

router.get("/:reportId", getReportByIdController);

router.patch(
    "/:reportId",
    updateReportController
);

router.delete(
    "/:reportId",
    deleteReportController
);

export default router;