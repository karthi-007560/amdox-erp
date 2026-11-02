
import mongoose from "mongoose";

import {
    findAccountById,
    findJournalEntryById,
    findJournalEntryByNumber,
    createJournalEntry,
    updateJournalEntryStatus,
    createReversalJournalEntry,
    markJournalAsReversed,
} from "../../repositories/finance/ledgerRepository.js";

import { findTenantById } from "../../repositories/tenantRepository.js";


interface JournalLineInput {
    accountId: string;
    description?: string;
    debit: string;
    credit: string;
}

export interface CreateJournalInput {
    tenantId: string;
    journalNumber: string;
    entryDate: Date;
    description: string;
    reference?: string;
    entries: JournalLineInput[];
    createdBy: string;
}


function validateObjectId(id: string, errorCode: string) {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error(errorCode);
    }
}

async function validateActiveTenant(tenantId: string) {
    validateObjectId(tenantId, "INVALID_TENANT_ID");

    const tenant = await findTenantById(tenantId);

    if (!tenant) {
        throw new Error("TENANT_NOT_FOUND");
    }

    if (tenant.status !== "active") {
        throw new Error("TENANT_NOT_ACTIVE");
    }

    return tenant;
}


function parseDecimal(value: string): {
    coefficient: bigint;
    scale: number;
} {
    if (
        typeof value !== "string" ||
        !/^\d+(\.\d{1,18})?$/.test(value)
    ) {
        throw new Error("INVALID_JOURNAL_AMOUNT");
    }

    const [whole, fraction = ""] = value.split(".");

    return {
        coefficient: BigInt(whole + fraction),
        scale: fraction.length,
    };
}

function normalizeDecimal(value: string): string {
    const { coefficient, scale } = parseDecimal(value);

    if (scale === 0) {
        return coefficient.toString();
    }

    const padded = coefficient
        .toString()
        .padStart(scale + 1, "0");

    const whole = padded.slice(0, -scale);
    const fraction = padded
        .slice(-scale)
        .replace(/0+$/, "");

    const normalizedWhole = whole.replace(/^0+(?=\d)/, "");

    return fraction
        ? `${normalizedWhole}.${fraction}`
        : normalizedWhole;
}

function sumDecimals(values: string[]): string {
    const parsed = values.map(parseDecimal);

    const maxScale = Math.max(
        0,
        ...parsed.map((item) => item.scale)
    );

    const total = parsed.reduce((sum, item) => {
        const multiplier =
            10n ** BigInt(maxScale - item.scale);

        return sum + item.coefficient * multiplier;
    }, 0n);

    const divisor = 10n ** BigInt(maxScale);

    const whole = total / divisor;

    if (maxScale === 0) {
        return whole.toString();
    }

    const fraction = (total % divisor)
        .toString()
        .padStart(maxScale, "0");

    return normalizeDecimal(`${whole}.${fraction}`);
}


function validateBalancedEntries(entries: JournalLineInput[]) {
    if (!Array.isArray(entries) || entries.length < 2) {
        throw new Error("JOURNAL_REQUIRES_AT_LEAST_TWO_LINES");
    }

    for (const entry of entries) {
        if (!entry.accountId) {
            throw new Error("JOURNAL_ACCOUNT_REQUIRED");
        }

        validateObjectId(
            entry.accountId,
            "INVALID_JOURNAL_ACCOUNT_ID"
        );

        const debit = parseDecimal(entry.debit);
        const credit = parseDecimal(entry.credit);

        const hasDebit = debit.coefficient > 0n;
        const hasCredit = credit.coefficient > 0n;

        if (hasDebit === hasCredit) {
            throw new Error("INVALID_JOURNAL_LINE_AMOUNT");
        }
    }

    const totalDebit = sumDecimals(
        entries.map((entry) => entry.debit)
    );

    const totalCredit = sumDecimals(
        entries.map((entry) => entry.credit)
    );

    if (totalDebit !== totalCredit) {
        throw new Error("JOURNAL_ENTRY_NOT_BALANCED");
    }

    return {
        totalDebit,
        totalCredit,
    };
}


async function validateJournalAccounts(
    entries: JournalLineInput[],
    tenantId: string
) {
    for (const entry of entries) {
        const account = await findAccountById(
            entry.accountId,
            tenantId
        );

        if (!account) {
            throw new Error("JOURNAL_ACCOUNT_NOT_FOUND");
        }

        if (!account.isActive) {
            throw new Error("JOURNAL_ACCOUNT_NOT_ACTIVE");
        }
    }
}


export async function createJournalEntryService(
    input: CreateJournalInput
) {
    await validateActiveTenant(input.tenantId);

    validateObjectId(
        input.createdBy,
        "INVALID_CREATED_BY_USER_ID"
    );

    const journalNumber = input.journalNumber
        .trim()
        .toUpperCase();

    const description = input.description.trim();

    if (!journalNumber || !description) {
        throw new Error(
            "JOURNAL_NUMBER_AND_DESCRIPTION_REQUIRED"
        );
    }

    if (
        !(input.entryDate instanceof Date) ||
        Number.isNaN(input.entryDate.getTime())
    ) {
        throw new Error("INVALID_JOURNAL_ENTRY_DATE");
    }

    const existingJournal = await findJournalEntryByNumber(
        input.tenantId,
        journalNumber
    );

    if (existingJournal) {
        throw new Error("JOURNAL_NUMBER_ALREADY_EXISTS");
    }

    const { totalDebit, totalCredit } =
        validateBalancedEntries(input.entries);

    await validateJournalAccounts(
        input.entries,
        input.tenantId
    );

    return createJournalEntry({
        ...input,
        journalNumber,
        description,
        totalDebit,
        totalCredit,
    });
}


export async function postJournalEntryService(
    journalId: string,
    tenantId: string,
    postedBy: string
) {
    validateObjectId(
        journalId,
        "INVALID_JOURNAL_ID"
    );

    validateObjectId(
        postedBy,
        "INVALID_POSTED_BY_USER_ID"
    );

    await validateActiveTenant(tenantId);

    const journal = await findJournalEntryById(
        journalId,
        tenantId
    );

    if (!journal) {
        throw new Error("JOURNAL_ENTRY_NOT_FOUND");
    }

    if (journal.status !== "draft") {
        throw new Error("ONLY_DRAFT_JOURNALS_CAN_BE_POSTED");
    }

    const entries: JournalLineInput[] = journal.entries.map(
        (entry) => ({
            accountId: entry.accountId.toString(),
            description: entry.description,
            debit: entry.debit.toString(),
            credit: entry.credit.toString(),
        })
    );

    const { totalDebit, totalCredit } =
        validateBalancedEntries(entries);

    await validateJournalAccounts(entries, tenantId);

    if (
        normalizeDecimal(totalDebit) !==
            normalizeDecimal(journal.totalDebit.toString()) ||
        normalizeDecimal(totalCredit) !==
            normalizeDecimal(journal.totalCredit.toString())
    ) {
        throw new Error("JOURNAL_TOTALS_MISMATCH");
    }

    const postedJournal = await updateJournalEntryStatus(
        journalId,
        tenantId,
        "posted",
        postedBy
    );

    if (!postedJournal) {
        throw new Error("JOURNAL_POSTING_FAILED");
    }

    return postedJournal;
}


export async function reverseJournalEntryService(
    journalId: string,
    tenantId: string,
    reversedBy: string,
    reversalJournalNumber: string
) {
    validateObjectId(
        journalId,
        "INVALID_JOURNAL_ID"
    );

    validateObjectId(
        reversedBy,
        "INVALID_REVERSED_BY_USER_ID"
    );

    await validateActiveTenant(tenantId);

    const journal = await findJournalEntryById(
        journalId,
        tenantId
    );

    if (!journal) {
        throw new Error("JOURNAL_ENTRY_NOT_FOUND");
    }

    if (journal.status !== "posted") {
        throw new Error(
            "ONLY_POSTED_JOURNALS_CAN_BE_REVERSED"
        );
    }

    const normalizedNumber = reversalJournalNumber
        .trim()
        .toUpperCase();

    if (!normalizedNumber) {
        throw new Error("REVERSAL_JOURNAL_NUMBER_REQUIRED");
    }

    const existingReversal = await findJournalEntryByNumber(
        tenantId,
        normalizedNumber
    );

    if (existingReversal) {
        throw new Error("JOURNAL_NUMBER_ALREADY_EXISTS");
    }

    const reversalEntries: JournalLineInput[] =
        journal.entries.map((entry) => ({
            accountId: entry.accountId.toString(),
            description: entry.description
                ? `Reversal: ${entry.description}`
                : "Journal reversal",
            debit: entry.credit.toString(),
            credit: entry.debit.toString(),
        }));

    const totalDebit = normalizeDecimal(
        journal.totalCredit.toString()
    );

    const totalCredit = normalizeDecimal(
        journal.totalDebit.toString()
    );

    const {
        totalDebit: verifiedDebit,
        totalCredit: verifiedCredit,
    } = validateBalancedEntries(reversalEntries);

    if (
        verifiedDebit !== totalDebit ||
        verifiedCredit !== totalCredit
    ) {
        throw new Error("REVERSAL_TOTALS_MISMATCH");
    }

    await validateJournalAccounts(
        reversalEntries,
        tenantId
    );

    const session = await mongoose.startSession();

    try {
        let reversalJournal: unknown;

        await session.withTransaction(async () => {
            const reversal = await createReversalJournalEntry(
                {
                    tenantId,
                    journalNumber: normalizedNumber,
                    entryDate: new Date(),
                    description: `Reversal of ${journal.journalNumber}`,
                    reference: journal.journalNumber,
                    entries: reversalEntries,
                    totalDebit,
                    totalCredit,
                    createdBy: reversedBy,
                    postedBy: reversedBy,
                    reversalOf: journal._id,
                },
                session
            );

            const updatedOriginal = await markJournalAsReversed(
                journalId,
                tenantId,
                session
            );

            if (!updatedOriginal) {
                throw new Error(
                    "JOURNAL_REVERSAL_UPDATE_FAILED"
                );
            }

            reversalJournal = reversal;
        });

        return reversalJournal;
    } finally {
        await session.endSession();
    }
}
