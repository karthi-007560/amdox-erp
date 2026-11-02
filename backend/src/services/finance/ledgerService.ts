
import mongoose from "mongoose";

import {
    createAccount,
    findAccountById,
    findAccountsByTenant,
    findByAccountCode,
    updateAccount,
    deactivateAccount,
} from "../../repositories/finance/ledgerRepository";

import {
    findTenantById,
} from "../../repositories/tenantRepository";

import type {
    CreateAccountInput,
    UpdateAccountInput,
} from "../../repositories/finance/ledgerRepository";

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

async function validateParentAccount(
    parentAccountId: string,
    tenantId: string,
    currentAccountId?: string
) {
    validateObjectId(
        parentAccountId,
        "INVALID_PARENT_ACCOUNT_ID"
    );

    if (
        currentAccountId &&
        parentAccountId === currentAccountId
    ) {
        throw new Error("ACCOUNT_CANNOT_BE_ITS_OWN_PARENT");
    }

    let currentParentId: string | undefined = parentAccountId;
    const visited = new Set<string>();

    while (currentParentId) {
        if (visited.has(currentParentId)) {
            throw new Error("ACCOUNT_HIERARCHY_CYCLE_DETECTED");
        }
        visited.add(currentParentId);
        if (currentAccountId && currentParentId === currentAccountId) {
            throw new Error("ACCOUNT_HIERARCHY_CYCLE_DETECTED");
        }
        const parent = await findAccountById(
            currentParentId,
            tenantId
        );
        if (!parent) {
            throw new Error("PARENT_ACCOUNT_NOT_FOUND");
        }
        if (!parent.isActive) {
            throw new Error("PARENT_ACCOUNT_NOT_ACTIVE");
        }
        currentParentId = parent.parentAccount?.toString();
    }
}

export async function createAccountService(
    input: CreateAccountInput
) {
    const tenantId = input.tenantId.toString();

    await validateActiveTenant(tenantId);

    const accountCode = input.accountCode.trim().toUpperCase();
    const accountName = input.accountName.trim();

    if (!accountCode || !accountName) {
        throw new Error("ACCOUNT_CODE_AND_NAME_REQUIRED");
    }

    const existingAccount = await findByAccountCode(
        tenantId,
        accountCode
    );

    if (existingAccount) {
        throw new Error("ACCOUNT_CODE_ALREADY_EXISTS");
    }

    if (input.parentAccount) {
        await validateParentAccount(
            input.parentAccount.toString(),
            tenantId
        );
    }

    return createAccount({
        ...input,
        tenantId,
        accountCode,
        accountName,
    });
}

export async function getAccountByIdService(
    accountId: string,
    tenantId: string
) {
    validateObjectId(accountId, "INVALID_ACCOUNT_ID");
    await validateActiveTenant(tenantId);

    const account = await findAccountById(
        accountId,
        tenantId
    );

    if (!account) {
        throw new Error("ACCOUNT_NOT_FOUND");
    }
    return account;
}

export async function getAccountsByTenantService(
    tenantId: string
) {
    await validateActiveTenant(tenantId);

    return findAccountsByTenant(tenantId);
}

export async function updateAccountService(
    accountId: string,
    tenantId: string,
    updates: UpdateAccountInput
) {
    validateObjectId(accountId, "INVALID_ACCOUNT_ID");

    await validateActiveTenant(tenantId);

    const existingAccount = await findAccountById(
        accountId,
        tenantId
    );

    if (!existingAccount) {
        throw new Error("ACCOUNT_NOT_FOUND");
    }

    if (updates.accountCode !== undefined) {
        const accountCode = updates.accountCode.trim().toUpperCase();

        if (!accountCode) {
            throw new Error("ACCOUNT_CODE_REQUIRED");
        }

        const duplicateAccount = await findByAccountCode(
            tenantId,
            accountCode
        );

        if (
            duplicateAccount &&
            duplicateAccount._id.toString() !== accountId
        ) {
            throw new Error("ACCOUNT_CODE_ALREADY_EXISTS");
        }

        updates.accountCode = accountCode;
    }

    if (updates.accountName !== undefined) {
        updates.accountName = updates.accountName.trim();

        if (!updates.accountName) {
            throw new Error("ACCOUNT_NAME_REQUIRED");
        }
    }

    if (updates.parentAccount) {
        await validateParentAccount(
            updates.parentAccount.toString(),
            tenantId,
            accountId
        );
    }

    const updatedAccount = await updateAccount(
        accountId,
        tenantId,
        updates
    );

    if (!updatedAccount) {
        throw new Error("ACCOUNT_UPDATE_FAILED");
    }

    return updatedAccount;
}

export async function deactivateAccountService(
    accountId: string,
    tenantId: string
) {
    validateObjectId(accountId, "INVALID_ACCOUNT_ID");

    await validateActiveTenant(tenantId);

    const existingAccount = await findAccountById(
        accountId,
        tenantId
    );

    if (!existingAccount) {
        throw new Error("ACCOUNT_NOT_FOUND");
    }

    if (!existingAccount.isActive) {
        throw new Error("ACCOUNT_ALREADY_INACTIVE");
    }

    const deactivatedAccount = await deactivateAccount(
        accountId,
        tenantId
    );

    if (!deactivatedAccount) {
        throw new Error("ACCOUNT_DEACTIVATION_FAILED");
    }

    return deactivatedAccount;
}
