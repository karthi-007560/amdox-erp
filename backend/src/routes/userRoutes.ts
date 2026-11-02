
import { Router } from "express";

import {
    getUsersController,
    getUserByIdController,
    updateUserController,
} from "../controllers/userController";

import { authenticateToken, authorizeRoles } from "../middleware/authMiddleware";
import { tenantContext } from "../middleware/tenantContext.middleware";

const router = Router();

router.use(authenticateToken, tenantContext);

router.get("/",authorizeRoles("admin", "manager"),getUsersController);

router.get("/:userId",authorizeRoles("admin", "manager"),getUserByIdController);

router.patch("/:userId",authorizeRoles("admin"),updateUserController);

export default router;
