
import { Router } from "express";

import {
    processPayrollController,
    getPayrollsController,
    getPayrollController,
    getEmployeePayrollsController,
    generatePayslipController,
    getPayslipsController,
    getEmployeePayslipsController,
    getMyPayslipsController,
    getPayslipController,
    publishPayslipController,
} from "../../controllers/hr/payrollController";

import {
    validateProcessPayroll,
} from "../../validators/hr.validator";

import {
    authenticateToken,
    authorizeRoles,
} from "../../middleware/authMiddleware";

import { tenantContext } from "../../middleware/tenantContext.middleware";

const router = Router();

router.use(authenticateToken);
router.use(tenantContext);

router.get(
    "/payslips/my",
    authorizeRoles("employee"),
    getMyPayslipsController
);

router.use(authorizeRoles("admin", "manager"));

router.post("/", validateProcessPayroll, processPayrollController);
router.get("/", getPayrollsController);
router.get("/employee/:employeeId", getEmployeePayrollsController);
router.get("/:payrollId", getPayrollController);


router.post("/payslips/generate", generatePayslipController);
router.get("/payslips", getPayslipsController);
router.get(
    "/payslips/employee/:employeeId",
    getEmployeePayslipsController
);
router.get("/payslips/:payslipId", getPayslipController);
router.patch(
    "/payslips/:payslipId/publish",
    publishPayslipController
);

export default router;
