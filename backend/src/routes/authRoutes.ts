import { Router } from "express";
import {
    getAuthStatus,
    registerUser,
    loginUser,
    getCurrentUser,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";
import { authRateLimiter } from "../middleware/rateLimiter.middleware";
import {
    validateRegistration,
    validateLogin,
} from "../validators/auth.validator";

const router = Router();

router.get("/status", getAuthStatus);

router.post(
    "/register",
    authRateLimiter,
    validateRegistration,
    registerUser
);

router.post(
    "/login",
    authRateLimiter,
    validateLogin,
    loginUser
);

router.get("/me", authenticateToken, getCurrentUser);

export default router;