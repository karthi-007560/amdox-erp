
import { Router } from "express";

import {
    createEmployeeController,
    getEmployeesController,
    getEmployeeController,
    updateEmployeeController,
    deleteEmployeeController,
} from "../../controllers/hr/employeeController";

import {
    validateCreateEmployee,
    validateUpdateEmployee,
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

router.post("/", validateCreateEmployee, createEmployeeController);
router.get("/", getEmployeesController);
router.get("/:employeeId", getEmployeeController);
router.patch("/:employeeId", validateUpdateEmployee, updateEmployeeController);
router.delete("/:employeeId", deleteEmployeeController);

export default router;
