import { Types } from "mongoose";
import type { ClientSession } from "mongoose";

import {
    ChartOfAccounts,
    AccountType,
} from "../../models/finance/ChartOfAccounts.js";

import {
    JournalEntry,
    JournalStatus,
} from "../../models/finance/JournalEntry.js";

type AccountId = string | Types.ObjectId;

export interface CreateAccountInput {
    tenantId: AccountId;
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    description?: string;
    parentAccount?: AccountId;
    isActive?: boolean;
}

export interface UpdateAccountInput {
    accountCode?: string;
    accountName?: string;
    accountType?: AccountType;
    description?: string;
    parentAccount?: AccountId | null;
    isActive?: boolean;
}

export const createAccount = async (
    input: CreateAccountInput
) => {
    return await ChartOfAccounts.create({
        tenantId: input.tenantId,
        accountCode: input.accountCode.trim().toUpperCase(),
        accountName: input.accountName.trim(),
        accountType: input.accountType,
        description: input.description?.trim(),
        parentAccount: input.parentAccount,
        isActive: input.isActive ?? true,
    });
};

export const findAccountById = async (
    accountId: AccountId,
    tenantId: AccountId
) => {
    return await ChartOfAccounts.findOne({
        _id: accountId,
        tenantId,
    });
};

export const findAccountsByTenant = async (
    tenantId: AccountId
) => {
    return await ChartOfAccounts.find({ tenantId })
        .sort({ accountCode: 1 });
};

export const findByAccountCode = async (
    tenantId: AccountId,
    accountCode: string
) => {
    return await ChartOfAccounts.findOne({
        tenantId,
        accountCode: accountCode.trim().toUpperCase(),
    });
};

export const updateAccount = async (
    accountId: AccountId,
    tenantId: AccountId,
    updates: UpdateAccountInput
) => {
    const updateData: UpdateAccountInput = { ...updates };

    if (updates.accountCode !== undefined) {
        updateData.accountCode = updates.accountCode.trim().toUpperCase();
    }

    if (updates.accountName !== undefined) {
        updateData.accountName = updates.accountName.trim();
    }

    if (updates.description !== undefined) {
        updateData.description = updates.description.trim();
    }

    return await ChartOfAccounts.findOneAndUpdate(
        {
            _id: accountId,
            tenantId,
        },
        {
            $set: updateData,
        },
        {
            new: true,
            runValidators: true,
        }
    );
};

export const deactivateAccount = async (
    accountId: AccountId,
    tenantId: AccountId
) => {
    return await ChartOfAccounts.findOneAndUpdate(
        {
            _id: accountId,
            tenantId,
        },
        {
            $set: { isActive: false },
        },
        {
            new: true,
            runValidators: true,
        }
    );
};

export interface CreateJournalEntryInput {
    tenantId: AccountId;
    journalNumber: string;
    entryDate: Date;
    description: string;
    reference?: string;
    entries: {
        accountId: AccountId;
        description?: string;
        debit: string;
        credit: string;
    }[];
    totalDebit: string;
    totalCredit: string;
    createdBy: AccountId;
}

export const createJournalEntry = async (
    input: CreateJournalEntryInput
) => {
    return await JournalEntry.create({
        tenantId: input.tenantId,
        journalNumber: input.journalNumber.trim().toUpperCase(),
        entryDate: input.entryDate,
        description: input.description.trim(),
        reference: input.reference?.trim(),

        entries: input.entries.map((entry) => ({
            accountId: entry.accountId,
            description: entry.description?.trim(),
            debit: Types.Decimal128.fromString(entry.debit),
            credit: Types.Decimal128.fromString(entry.credit),
        })),

        totalDebit: Types.Decimal128.fromString(input.totalDebit),
        totalCredit: Types.Decimal128.fromString(input.totalCredit),

        createdBy: input.createdBy,
    });
};

export const findJournalEntryById = async (
    journalId: AccountId,
    tenantId: AccountId
) => {
    return await JournalEntry.findOne({
        _id: journalId,
        tenantId,
    });
};

export const findJournalEntryByNumber = async (
    tenantId: AccountId,
    journalNumber: string
) => {
    return await JournalEntry.findOne({
        tenantId,
        journalNumber: journalNumber.trim().toUpperCase(),
    });
};


export const updateJournalEntryStatus = async (
    journalId: AccountId,
    tenantId: AccountId,
    status: JournalStatus,
    postedBy?: AccountId
) => {
    const filter: {
        _id: AccountId;
        tenantId: AccountId;
        status?: JournalStatus;
    } = {
        _id: journalId,
        tenantId,
    };

    const updateData: {
        status: JournalStatus;
        postedBy?: AccountId;
        postedAt?: Date;
    } = { status };

    if (status === "posted") {
        filter.status = "draft";

        if (!postedBy) {
            throw new Error("POSTED_BY_REQUIRED");
        }

        updateData.postedBy = postedBy;
        updateData.postedAt = new Date();
    }

    return await JournalEntry.findOneAndUpdate(
        filter,
        {
            $set: updateData,
        },
        {
            new: true,
            runValidators: true,
        }
    );
};


export const createReversalJournalEntry = async (
    input: CreateJournalEntryInput & {
        postedBy: AccountId;
        reversalOf: AccountId;
    },
    session: ClientSession
) => {
    const [reversal] = await JournalEntry.create(
        [
            {
                tenantId: input.tenantId,
                journalNumber: input.journalNumber.trim().toUpperCase(),
                entryDate: input.entryDate,
                description: input.description.trim(),
                reference: input.reference?.trim(),

                entries: input.entries.map((entry) => ({
                    accountId: entry.accountId,
                    description: entry.description?.trim(),
                    debit: Types.Decimal128.fromString(entry.debit),
                    credit: Types.Decimal128.fromString(entry.credit),
                })),

                totalDebit: Types.Decimal128.fromString(input.totalDebit),
                totalCredit: Types.Decimal128.fromString(input.totalCredit),

                createdBy: input.createdBy,
                postedBy: input.postedBy,
                postedAt: new Date(),

                status: "posted",
                reversalOf: input.reversalOf,
            },
        ],
        { session }
    );

    return reversal;
};

export const markJournalAsReversed = async (
    journalId: AccountId,
    tenantId: AccountId,
    session: ClientSession
) => {
    return await JournalEntry.findOneAndUpdate(
        {
            _id: journalId,
            tenantId,
            status: "posted",
        },
        {
            $set: {
                status: "reversed",
            },
        },
        {
            new: true,
            runValidators: true,
            session,
        }
    );
};