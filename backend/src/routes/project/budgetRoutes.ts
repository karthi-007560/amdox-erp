
import { Router } from "express";
import {
    createBudgetController,
    getAllBudgetsController,
    getBudgetByIdController,
    updateBudgetController,
    approveBudgetController,
    deleteBudgetController
} from "../../controllers/project/budgetController";
import { authenticateToken, authorizeRoles } from "../../middleware/authMiddleware";
import { tenantContext } from "../../middleware/tenantContext.middleware";
import { validateBudget } from "../../validators/project.validator";

const router = Router();

router.use(authenticateToken, tenantContext);

router.post(
    "/",
    authorizeRoles("admin", "manager"),
    createBudgetController
);

router.get("/", getAllBudgetsController);

router.get("/:budgetId", getBudgetByIdController);

router.patch(
    "/:budgetId",
    authorizeRoles("admin", "manager"),
    updateBudgetController
);

router.patch(
    "/:budgetId/approve",
    authorizeRoles("admin", "manager"),
    approveBudgetController
);

router.delete(
    "/:budgetId",
    authorizeRoles("admin"),
    deleteBudgetController
);

router.post("/", authorizeRoles("admin", "manager"), validateBudget, createBudgetController);

router.patch("/:budgetId", authorizeRoles("admin", "manager"), validateBudget, updateBudgetController);

export default router;
