
import { Router } from "express";

import { authenticateToken, authorizeRoles } from "../../middleware/authMiddleware.js";
import { tenantContext } from "../../middleware/tenantContext.middleware.js";

import {
    createReceivableInvoiceController,
    getReceivableInvoicesController,
    getReceivableInvoiceController,
    recordReceivablePaymentController,
    getReceivablePaymentsController,
    getReceivableInvoicePaymentsController,
    updateReceivablePaymentStatusController,
} from "../../controllers/finance/arController.js";

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


router.post("/invoices", validateCreateInvoice, createReceivableInvoiceController);
router.get("/invoices", validateInvoiceStatusQuery, getReceivableInvoicesController);
router.get("/invoices/:invoiceId", validateInvoiceId, getReceivableInvoiceController);


router.post("/payments", validateRecordPayment, recordReceivablePaymentController);
router.get("/payments", validatePaymentStatusQuery, getReceivablePaymentsController);
router.get("/invoices/:invoiceId/payments", validateInvoiceId, getReceivableInvoicePaymentsController);
router.patch(
    "/payments/:paymentId/status",
    validatePaymentId,
    validateUpdatePaymentStatus,
    updateReceivablePaymentStatusController
);

export default router;
