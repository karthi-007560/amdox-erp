import { Router } from "express";

import {
    createInventoryController,
    getInventoryController,
    getInventoryItemController,
    updateInventoryController,
    deleteInventoryController,
    getReorderSuggestionsController,
} from "../../controllers/supplyChain/inventoryController";

import {
    validateCreateInventory,
    validateUpdateInventory,
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


router.post("/", validateCreateInventory, createInventoryController);
router.get("/", getInventoryController);

router.get("/reorder-suggestions", getReorderSuggestionsController);

router.get("/:inventoryId", getInventoryItemController);
router.patch("/:inventoryId", validateUpdateInventory, updateInventoryController);
router.delete("/:inventoryId", deleteInventoryController);


export default router;