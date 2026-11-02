import { Router } from "express";

import {
    createAttendanceController,
    getAttendancesController,
    getAttendanceController,
    updateAttendanceController,
    deleteAttendanceController,
} from "../../controllers/hr/attendanceController";

import {
    validateCreateAttendance,
    validateUpdateAttendance,
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


router.post("/", validateCreateAttendance, createAttendanceController);

router.get("/", getAttendancesController);

router.get("/:attendanceId", getAttendanceController);

router.patch("/:attendanceId", validateUpdateAttendance, updateAttendanceController);

router.delete("/:attendanceId", deleteAttendanceController);

export default router;