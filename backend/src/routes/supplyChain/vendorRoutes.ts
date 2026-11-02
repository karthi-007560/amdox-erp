import { Router } from "express";

import {
    createVendorController,
    getVendorsController,
    getVendorController,
    updateVendorController,
    deleteVendorController,
} from "../../controllers/supplyChain/vendorController";

import {
    validateCreateVendor,
    validateUpdateVendor,
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

router.post("/", validateCreateVendor, createVendorController);
router.get("/", getVendorsController);
router.get("/:vendorId", getVendorController);
router.patch("/:vendorId", validateUpdateVendor, updateVendorController);
router.delete("/:vendorId", deleteVendorController);

export default router;