import { Router } from "express";

import {
    createPurchaseOrderController,
    getPurchaseOrdersController,
    getPurchaseOrderController,
    updatePurchaseOrderController,
    approvePurchaseOrderController,
    deletePurchaseOrderController,
    createGoodsReceiptController,
    matchPurchaseOrderInvoiceController,
} from "../../controllers/supplyChain/poController";

import {
    validateCreatePurchaseOrder,
    validateUpdatePurchaseOrder,
    validateCreateGoodsReceipt,
} from "../../validators/supplyChain.validator";

import {
    authenticateToken,
    authorizeRoles,
} from "../../middleware/authMiddleware";

import {
    tenantContext,
} from "../../middleware/tenantContext.middleware";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles("admin", "manager"));
router.use(tenantContext);

router.post(
    "/",
    validateCreatePurchaseOrder,
    createPurchaseOrderController
);

router.get(
    "/",
    getPurchaseOrdersController
);


router.patch(
    "/:purchaseOrderId/approve",
    authorizeRoles("admin"),
    approvePurchaseOrderController
);


router.post(
    "/:purchaseOrderId/receipts",
    validateCreateGoodsReceipt,
    createGoodsReceiptController
);

router.get(
    "/:purchaseOrderId/match/:invoiceId",
    matchPurchaseOrderInvoiceController
);

router.get(
    "/:purchaseOrderId",
    getPurchaseOrderController
);

router.patch(
    "/:purchaseOrderId",
    validateUpdatePurchaseOrder,
    updatePurchaseOrderController
);

router.delete(
    "/:purchaseOrderId",
    deletePurchaseOrderController
);

export default router;