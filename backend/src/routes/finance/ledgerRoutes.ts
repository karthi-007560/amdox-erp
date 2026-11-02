
import { Router } from "express";

import {
    createAccountController,
    getAccountsController,
    getAccountController,
    updateAccountController,
    deactivateAccountController,
    createJournalEntryController,
    postJournalEntryController,
    reverseJournalEntryController,
} from "../../controllers/finance/ledgerController";

import {
    authenticateToken,
    authorizeRoles,
} from "../../middleware/authMiddleware";

import { tenantContext } from "../../middleware/tenantContext.middleware";

import {
    validateCreateAccount,
    validateUpdateAccount,
    validateAccountId,
    validateCreateJournalEntry,
    validateJournalId,
    validateReverseJournalEntry,
} from "../../validators/finance.validator";

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles("admin", "manager"));
router.use(tenantContext);


router.post("/", validateCreateAccount, createAccountController);
router.get("/", getAccountsController);
router.get("/:accountId", validateAccountId, getAccountController);
router.patch("/:accountId", validateAccountId, validateUpdateAccount, updateAccountController);
router.delete("/:accountId", validateAccountId, deactivateAccountController);


router.post("/journals", validateCreateJournalEntry, createJournalEntryController);
router.patch("/journals/:journalId/post", validateJournalId, postJournalEntryController);
router.post(
    "/journals/:journalId/reverse",
    validateJournalId,
    validateReverseJournalEntry,
    reverseJournalEntryController
);

export default router;
