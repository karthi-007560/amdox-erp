
import { Router } from "express";

import { authenticateToken, authorizeRoles } from "../../middleware/authMiddleware.js";
import { tenantContext } from "../../middleware/tenantContext.middleware.js";

import {
    createPayableInvoiceController,
    getPayableInvoicesController,
    getPayableInvoiceController,
    recordPayablePaymentController,
    getPayablePaymentsController,
    getInvoicePaymentsController,
    updatePayablePaymentStatusController,
} from "../../controllers/finance/apController.js";

import {
    validateCreateInvoice,
    validateInvoiceStatusQuery,
    validateInvoiceId,
    validateRecordPayment,
    validatePaymentStatusQuery,
    validatePaymentId,
    validateUpdatePaymentStatus,
} from "../../validators/finance.validator.js";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles("admin", "manager"));
router.use(tenantContext);


router.post("/invoices", validateCreateInvoice, createPayableInvoiceController);
router.get("/invoices", validateInvoiceStatusQuery, getPayableInvoicesController);
router.get("/invoices/:invoiceId", validateInvoiceId, getPayableInvoiceController);


router.post("/payments", validateRecordPayment, recordPayablePaymentController);
router.get("/payments", validatePaymentStatusQuery, getPayablePaymentsController);
router.get("/invoices/:invoiceId/payments", validateInvoiceId, getInvoicePaymentsController);
router.patch(
    "/payments/:paymentId/status",
    validatePaymentId,
    validateUpdatePaymentStatus,
    updatePayablePaymentStatusController
);

export default router;
