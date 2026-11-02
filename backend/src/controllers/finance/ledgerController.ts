
import type { Request, Response, NextFunction } from "express";

import {
    createAccountService,
    getAccountByIdService,
    getAccountsByTenantService,
    updateAccountService,
    deactivateAccountService,
} from "../../services/finance/ledgerService.js";

import {
    createJournalEntryService,
    postJournalEntryService,
    reverseJournalEntryService,
} from "../../services/finance/accountingEngine.js";

import type { CreateJournalInput } from "../../services/finance/accountingEngine.js";

import type { AccountType } from "../../models/finance/ChartOfAccounts.js";
import type { UpdateAccountInput } from "../../repositories/finance/ledgerRepository.js";

const ACCOUNT_TYPES: AccountType[] = [
    "asset",
    "liability",
    "equity",
    "revenue",
    "expense",
];

function getErrorStatus(error: unknown): number {
    const message = error instanceof Error ? error.message : "";

    if (message.startsWith("INVALID_")) {
        return 400;
    }

    switch (message) {
        case "ACCOUNT_CODE_AND_NAME_REQUIRED":
        case "ACCOUNT_CODE_REQUIRED":
        case "ACCOUNT_NAME_REQUIRED":
        case "ACCOUNT_CANNOT_BE_ITS_OWN_PARENT":
        case "ACCOUNT_HIERARCHY_CYCLE_DETECTED":
        case "JOURNAL_NUMBER_AND_DESCRIPTION_REQUIRED":
        case "JOURNAL_REQUIRES_AT_LEAST_TWO_LINES":
        case "JOURNAL_ACCOUNT_REQUIRED":
        case "INVALID_JOURNAL_LINE_AMOUNT":
        case "JOURNAL_ENTRY_NOT_BALANCED":
        case "JOURNAL_TOTALS_MISMATCH":
        case "REVERSAL_TOTALS_MISMATCH":
        case "REVERSAL_JOURNAL_NUMBER_REQUIRED":
            return 400;

        case "TENANT_NOT_FOUND":
        case "ACCOUNT_NOT_FOUND":
        case "PARENT_ACCOUNT_NOT_FOUND":
        case "JOURNAL_ENTRY_NOT_FOUND":
        case "JOURNAL_ACCOUNT_NOT_FOUND":
            return 404;

        case "ACCOUNT_CODE_ALREADY_EXISTS":
        case "TENANT_NOT_ACTIVE":
        case "PARENT_ACCOUNT_NOT_ACTIVE":
        case "ACCOUNT_ALREADY_INACTIVE":
        case "JOURNAL_NUMBER_ALREADY_EXISTS":
        case "JOURNAL_ACCOUNT_NOT_ACTIVE":
        case "ONLY_DRAFT_JOURNALS_CAN_BE_POSTED":
        case "ONLY_POSTED_JOURNALS_CAN_BE_REVERSED":
            return 409;

        default:
            return 500;
    }
}

function sendError(
    error: unknown,
    res: Response,
    next: NextFunction
): void {
    if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
    ) {
        res.status(409).json({
            success: false,
            message: "A record with this identifier already exists.",
        });
        return;
    }

    const status = getErrorStatus(error);

    if (status === 500) {
        next(error);
        return;
    }

    res.status(status).json({
        success: false,
        message: error instanceof Error
            ? error.message
            : "Request failed",
    });
}

function getTenantId(req: Request): string | undefined {
    return req.tenantId;
}

function getUserId(req: Request): string | undefined {
    return req.auth?.userId;
}

function getAccountId(req: Request): string | undefined {
    const accountId = req.params.accountId;

    return typeof accountId === "string" && accountId.trim()
        ? accountId.trim()
        : undefined;
}

function getJournalId(req: Request): string | undefined {
    const journalId = req.params.journalId;

    return typeof journalId === "string" && journalId.trim()
        ? journalId.trim()
        : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}


export async function createAccountController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        const {
            accountCode,
            accountName,
            accountType,
            description,
            parentAccount,
            isActive,
        } = req.body ?? {};

        if (
            typeof accountCode !== "string" ||
            typeof accountName !== "string" ||
            !accountCode.trim() ||
            !accountName.trim()
        ) {
            res.status(400).json({
                success: false,
                message: "ACCOUNT_CODE_AND_NAME_REQUIRED",
            });
            return;
        }

        if (
            typeof accountType !== "string" ||
            !ACCOUNT_TYPES.includes(accountType as AccountType)
        ) {
            res.status(400).json({
                success: false,
                message: "INVALID_ACCOUNT_TYPE",
            });
            return;
        }

        if (
            description !== undefined &&
            typeof description !== "string"
        ) {
            res.status(400).json({
                success: false,
                message: "INVALID_DESCRIPTION",
            });
            return;
        }

        if (
            parentAccount !== undefined &&
            typeof parentAccount !== "string"
        ) {
            res.status(400).json({
                success: false,
                message: "INVALID_PARENT_ACCOUNT_ID",
            });
            return;
        }

        if (
            isActive !== undefined &&
            typeof isActive !== "boolean"
        ) {
            res.status(400).json({
                success: false,
                message: "INVALID_ACCOUNT_STATUS",
            });
            return;
        }

        const account = await createAccountService({
            tenantId,
            accountCode,
            accountName,
            accountType: accountType as AccountType,
            description,
            parentAccount,
            isActive,
        });

        res.status(201).json({
            success: true,
            message: "Financial account created successfully.",
            data: account,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getAccountsController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        const accounts = await getAccountsByTenantService(tenantId);

        res.status(200).json({
            success: true,
            count: accounts.length,
            data: accounts,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function getAccountController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const accountId = getAccountId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!accountId) {
            res.status(400).json({
                success: false,
                message: "ACCOUNT_ID_REQUIRED",
            });
            return;
        }

        const account = await getAccountByIdService(
            accountId,
            tenantId
        );

        res.status(200).json({
            success: true,
            data: account,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function updateAccountController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const accountId = getAccountId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!accountId) {
            res.status(400).json({
                success: false,
                message: "ACCOUNT_ID_REQUIRED",
            });
            return;
        }

        const body = req.body ?? {};
        const updates: UpdateAccountInput = {};

        if (body.accountCode !== undefined) {
            if (typeof body.accountCode !== "string") {
                res.status(400).json({
                    success: false,
                    message: "INVALID_ACCOUNT_CODE",
                });
                return;
            }

            updates.accountCode = body.accountCode;
        }

        if (body.accountName !== undefined) {
            if (typeof body.accountName !== "string") {
                res.status(400).json({
                    success: false,
                    message: "INVALID_ACCOUNT_NAME",
                });
                return;
            }

            updates.accountName = body.accountName;
        }

        if (body.accountType !== undefined) {
            if (
                typeof body.accountType !== "string" ||
                !ACCOUNT_TYPES.includes(body.accountType as AccountType)
            ) {
                res.status(400).json({
                    success: false,
                    message: "INVALID_ACCOUNT_TYPE",
                });
                return;
            }

            updates.accountType = body.accountType as AccountType;
        }

        if (body.description !== undefined) {
            if (typeof body.description !== "string") {
                res.status(400).json({
                    success: false,
                    message: "INVALID_DESCRIPTION",
                });
                return;
            }

            updates.description = body.description;
        }

        if (body.parentAccount !== undefined) {
            if (
                body.parentAccount !== null &&
                typeof body.parentAccount !== "string"
            ) {
                res.status(400).json({
                    success: false,
                    message: "INVALID_PARENT_ACCOUNT_ID",
                });
                return;
            }

            updates.parentAccount = body.parentAccount;
        }

        if (body.isActive !== undefined) {
            if (typeof body.isActive !== "boolean") {
                res.status(400).json({
                    success: false,
                    message: "INVALID_ACCOUNT_STATUS",
                });
                return;
            }

            updates.isActive = body.isActive;
        }

        if (Object.keys(updates).length === 0) {
            res.status(400).json({
                success: false,
                message: "NO_ACCOUNT_FIELDS_TO_UPDATE",
            });
            return;
        }

        const account = await updateAccountService(
            accountId,
            tenantId,
            updates
        );

        res.status(200).json({
            success: true,
            message: "Financial account updated successfully.",
            data: account,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function deactivateAccountController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const accountId = getAccountId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!accountId) {
            res.status(400).json({
                success: false,
                message: "ACCOUNT_ID_REQUIRED",
            });
            return;
        }

        const account = await deactivateAccountService(
            accountId,
            tenantId
        );

        res.status(200).json({
            success: true,
            message: "Financial account deactivated successfully.",
            data: account,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}


export async function createJournalEntryController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const userId = getUserId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "AUTHENTICATED_USER_REQUIRED",
            });
            return;
        }

        const body: unknown = req.body;

        if (!isRecord(body)) {
            res.status(400).json({
                success: false,
                message: "INVALID_REQUEST_BODY",
            });
            return;
        }

        const {
            journalNumber,
            entryDate,
            description,
            reference,
            entries,
        } = body;

        if (
            typeof journalNumber !== "string" ||
            !journalNumber.trim() ||
            typeof description !== "string" ||
            !description.trim()
        ) {
            res.status(400).json({
                success: false,
                message: "JOURNAL_NUMBER_AND_DESCRIPTION_REQUIRED",
            });
            return;
        }

        if (
            typeof entryDate !== "string" ||
            !entryDate.trim() ||
            Number.isNaN(Date.parse(entryDate))
        ) {
            res.status(400).json({
                success: false,
                message: "INVALID_JOURNAL_ENTRY_DATE",
            });
            return;
        }

        if (
            reference !== undefined &&
            typeof reference !== "string"
        ) {
            res.status(400).json({
                success: false,
                message: "INVALID_JOURNAL_REFERENCE",
            });
            return;
        }

        if (!Array.isArray(entries) || entries.length < 2) {
            res.status(400).json({
                success: false,
                message: "JOURNAL_REQUIRES_AT_LEAST_TWO_LINES",
            });
            return;
        }

        for (const entry of entries) {
            if (
                !isRecord(entry) ||
                typeof entry.accountId !== "string" ||
                typeof entry.debit !== "string" ||
                typeof entry.credit !== "string" ||
                (
                    entry.description !== undefined &&
                    typeof entry.description !== "string"
                )
            ) {
                res.status(400).json({
                    success: false,
                    message: "INVALID_JOURNAL_LINE",
                });
                return;
            }
        }

        const input: CreateJournalInput = {
            tenantId,
            journalNumber,
            entryDate: new Date(entryDate),
            description,
            reference: reference as string | undefined,
            entries: entries as CreateJournalInput["entries"],
            createdBy: userId,
        };

        const journal = await createJournalEntryService(input);

        res.status(201).json({
            success: true,
            message: "Journal entry created successfully.",
            data: journal,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function postJournalEntryController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const userId = getUserId(req);
        const journalId = getJournalId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "AUTHENTICATED_USER_REQUIRED",
            });
            return;
        }

        if (!journalId) {
            res.status(400).json({
                success: false,
                message: "JOURNAL_ID_REQUIRED",
            });
            return;
        }

        const journal = await postJournalEntryService(
            journalId,
            tenantId,
            userId
        );

        res.status(200).json({
            success: true,
            message: "Journal entry posted successfully.",
            data: journal,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}

export async function reverseJournalEntryController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const tenantId = getTenantId(req);
        const userId = getUserId(req);
        const journalId = getJournalId(req);

        if (!tenantId) {
            res.status(403).json({
                success: false,
                message: "TENANT_CONTEXT_REQUIRED",
            });
            return;
        }

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "AUTHENTICATED_USER_REQUIRED",
            });
            return;
        }

        if (!journalId) {
            res.status(400).json({
                success: false,
                message: "JOURNAL_ID_REQUIRED",
            });
            return;
        }

        const body: unknown = req.body;

        if (
            !isRecord(body) ||
            typeof body.reversalJournalNumber !== "string" ||
            !body.reversalJournalNumber.trim()
        ) {
            res.status(400).json({
                success: false,
                message: "REVERSAL_JOURNAL_NUMBER_REQUIRED",
            });
            return;
        }

        const journal = await reverseJournalEntryService(
            journalId,
            tenantId,
            userId,
            body.reversalJournalNumber
        );

        res.status(201).json({
            success: true,
            message: "Journal entry reversed successfully.",
            data: journal,
        });
    } catch (error) {
        sendError(error, res, next);
    }
}
