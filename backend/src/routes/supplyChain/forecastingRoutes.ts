import { Router } from "express";

import {
    createForecastController,
    getForecastsController,
    getForecastController,
    deleteForecastController,
} from "../../controllers/supplyChain/forecastingController.js";

import {
    authenticateToken,
    authorizeRoles,
} from "../../middleware/authMiddleware.js";

import {
    tenantContext,
} from "../../middleware/tenantContext.middleware.js";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles("admin", "manager"));
router.use(tenantContext);

router.post("/", createForecastController);

router.get("/", getForecastsController);

router.get("/:forecastId", getForecastController);

router.delete("/:forecastId", deleteForecastController);

export default router;