
import { Router } from "express";

import authRoutes from "./authRoutes";
import tenantRoutes from "./tenantRoutes";
import userRoutes from "./userRoutes";

import employeeRoutes from "./hr/employeeRoutes";
import attendanceRoutes from "./hr/attendanceRoutes";
import leaveRoutes from "./hr/leaveRoutes";
import payrollRoutes from "./hr/payrollRoutes";
import organisationRoutes from "./hr/organisationRoutes";

import ledgerRoutes from "./finance/ledgerRoutes";
import apRoutes from "./finance/apRoutes";
import arRoutes from "./finance/arRoutes";
import currencyRoutes from "./finance/currencyRoutes";

import vendorRoutes from "./supplyChain/vendorRoutes";
import inventoryRoutes from "./supplyChain/inventoryRoutes";
import poRoutes from "./supplyChain/poRoutes";
import forecastingRoutes from "./supplyChain/forecastingRoutes.js";

import projectRoutes from "./project/projectRoutes";
import taskRoutes from "./project/taskRoutes";
import resourceRoutes from "./project/resourceRoutes";
import budgetRoutes from "./project/budgetRoutes";

import dashboardRoutes from "./dashboard/dashboardRoutes";
import reportRoutes from "./dashboard/reportRoutes";
import widgetRoutes from "./dashboard/widgetRoutes";

import notificationRoutes from "./notifications/notificationRoutes";
import webhookRoutes from "./notifications/webhookRoutes";
import eventRoutes from "./notifications/eventRoutes";

import settingsRoutes from "./settings/settingsRoutes";
import roleRoutes from "./settings/roleRoutes";
import permissionRoutes from "./settings/permissionRoutes";
import integrationRoutes from "./settings/integrationRoutes";

const router = Router();

router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API is healthy"
    });
});

router.use("/auth", authRoutes);
router.use("/tenants", tenantRoutes);
router.use("/users", userRoutes);

router.use("/employees", employeeRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/leaves", leaveRoutes);
router.use("/payrolls", payrollRoutes);
router.use("/organisations", organisationRoutes);

router.use("/accounts", ledgerRoutes);
router.use("/accounts-payable", apRoutes);
router.use("/accounts-receivable", arRoutes);
router.use("/currencies", currencyRoutes);

router.use("/vendors", vendorRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/purchase-orders", poRoutes);
router.use("/forecasting", forecastingRoutes);

router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/resources", resourceRoutes);
router.use("/budgets", budgetRoutes);

router.use("/dashboards", dashboardRoutes);
router.use("/reports", reportRoutes);
router.use("/widgets", widgetRoutes);

router.use("/notifications", notificationRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/events", eventRoutes);

router.use("/settings", settingsRoutes);
router.use("/roles", roleRoutes);
router.use("/permissions", permissionRoutes);
router.use("/integrations", integrationRoutes);

export default router;
