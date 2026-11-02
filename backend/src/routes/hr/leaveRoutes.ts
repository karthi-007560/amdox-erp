
import { Router } from "express";

import {
    createLeaveController,
    getLeavesController,
    getEmployeeLeavesController,
    getLeaveController,
    approveLeaveController,
    rejectLeaveController,
    deleteLeaveController,
} from "../../controllers/hr/leaveController";

import {
    validateCreateLeave,
    validateApproveLeave,
    validateRejectLeave,
} from "../../validators/hr.validator";

import {
    authenticateToken,
    authorizeRoles,
} from "../../middleware/authMiddleware";

import { tenantContext } from "../../middleware/tenantContext.middleware";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles("admin", "manager"));
router.use(tenantContext);

router.post("/", validateCreateLeave, createLeaveController);
router.get("/", getLeavesController);
router.get("/employee/:employeeId", getEmployeeLeavesController);
router.get("/:leaveId", getLeaveController);
router.patch("/:leaveId/approve", validateApproveLeave, approveLeaveController);
router.patch("/:leaveId/reject", validateRejectLeave, rejectLeaveController);
router.delete("/:leaveId", deleteLeaveController);

export default router;
