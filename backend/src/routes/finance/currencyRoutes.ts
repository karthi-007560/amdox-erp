
import { Router } from "express";

import {
    createCurrencyController,
    getCurrenciesController,
    getCurrencyByIdController,
    getCurrencyByCodeController,
    updateCurrencyExchangeRateController,
    setBaseCurrencyController,
    deactivateCurrencyController,
    activateCurrencyController,
} from "../../controllers/finance/currencyController.js";

import {
    authenticateToken,
    authorizeRoles,
} from "../../middleware/authMiddleware.js";

import { tenantContext } from "../../middleware/tenantContext.middleware.js";

import {
    validateCreateCurrency,
    validateActiveOnlyQuery,
    validateCurrencyId,
    validateCurrencyCode,
    validateUpdateExchangeRate,
} from "../../validators/finance.validator.js";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles("admin", "manager"));
router.use(tenantContext);


router.post("/", validateCreateCurrency, createCurrencyController);
router.get("/", validateActiveOnlyQuery, getCurrenciesController);

router.get("/code/:code", validateCurrencyCode, getCurrencyByCodeController);
router.get("/:currencyId", validateCurrencyId, getCurrencyByIdController);


router.patch(
    "/:currencyId/exchange-rate",
    validateCurrencyId,
    validateUpdateExchangeRate,
    updateCurrencyExchangeRateController
);

router.patch("/:currencyId/base", validateCurrencyId, setBaseCurrencyController);
router.patch("/:currencyId/deactivate", validateCurrencyId, deactivateCurrencyController);
router.patch("/:currencyId/activate", validateCurrencyId, activateCurrencyController);

export default router;
