import { Types } from "mongoose";

import { Tenant } from "../../models/Tenant.js";
import { Currency } from "../../models/finance/Currency.js";
import { ChartOfAccounts } from "../../models/finance/ChartOfAccounts.js";

const accountDefinitions = [
    {
        accountCode: "1000",
        accountName: "Cash",
        accountType: "asset",
        description: "Cash and cash equivalents",
    },
    {
        accountCode: "1100",
        accountName: "Accounts Receivable",
        accountType: "asset",
        description: "Amounts receivable from customers",
    },
    {
        accountCode: "1200",
        accountName: "Inventory",
        accountType: "asset",
        description: "Inventory held for business operations",
    },
    {
        accountCode: "1500",
        accountName: "Equipment",
        accountType: "asset",
        description: "Business equipment and fixed assets",
    },
    {
        accountCode: "2000",
        accountName: "Accounts Payable",
        accountType: "liability",
        description: "Amounts payable to suppliers",
    },
    {
        accountCode: "2100",
        accountName: "Tax Payable",
        accountType: "liability",
        description: "Outstanding tax obligations",
    },
    {
        accountCode: "3000",
        accountName: "Owner Equity",
        accountType: "equity",
        description: "Owner's capital",
    },
    {
        accountCode: "3100",
        accountName: "Retained Earnings",
        accountType: "equity",
        description: "Accumulated retained earnings",
    },
    {
        accountCode: "4000",
        accountName: "Sales Revenue",
        accountType: "revenue",
        description: "Revenue generated from sales",
    },
    {
        accountCode: "4100",
        accountName: "Service Revenue",
        accountType: "revenue",
        description: "Revenue generated from services",
    },
    {
        accountCode: "5000",
        accountName: "Cost of Goods Sold",
        accountType: "expense",
        description: "Direct cost of goods sold",
    },
    {
        accountCode: "6000",
        accountName: "Salaries Expense",
        accountType: "expense",
        description: "Employee salary expenses",
    },
    {
        accountCode: "6100",
        accountName: "Rent Expense",
        accountType: "expense",
        description: "Business premises rent",
    },
    {
        accountCode: "6200",
        accountName: "Utilities Expense",
        accountType: "expense",
        description: "Electricity, water and utility expenses",
    },
] as const;

export const seedFinanceData = async (tenantId: string) => {
    if (!Types.ObjectId.isValid(tenantId)) {
        throw new Error("Invalid tenant ID");
    }

    const tenant = await Tenant.findOne({
        _id: tenantId,
        status: "active",
    });

    if (!tenant) {
        throw new Error("Active tenant not found");
    }

    const currencyCode = process.env.SEED_BASE_CURRENCY_CODE
        ?.trim()
        .toUpperCase();

    const currencyName = process.env.SEED_BASE_CURRENCY_NAME?.trim();
    const currencySymbol = process.env.SEED_BASE_CURRENCY_SYMBOL?.trim();

    if (
        !currencyCode ||
        !/^[A-Z]{3}$/.test(currencyCode) ||
        !currencyName ||
        !currencySymbol
    ) {
        throw new Error(
            "Configure SEED_BASE_CURRENCY_CODE, SEED_BASE_CURRENCY_NAME and SEED_BASE_CURRENCY_SYMBOL"
        );
    }

    const existingBaseCurrency = await Currency.findOne({
        tenantId,
        isBaseCurrency: true,
    });

    if (
        existingBaseCurrency &&
        existingBaseCurrency.code !== currencyCode
    ) {
        throw new Error(
            `Tenant already has ${existingBaseCurrency.code} as its base currency`
        );
    }

    const existingCurrency = await Currency.findOne({
        tenantId,
        code: currencyCode,
    });

    if (existingCurrency?.isBaseCurrency === false && existingBaseCurrency) {
        throw new Error(
            "The configured currency already exists but is not the tenant's base currency"
        );
    }

    const currency = await Currency.findOneAndUpdate(
        { tenantId, code: currencyCode },
        {
            $setOnInsert: {
                tenantId,
                code: currencyCode,
                name: currencyName,
                symbol: currencySymbol,
                exchangeRate: Types.Decimal128.fromString("1"),
                isBaseCurrency: true,
                isActive: true,
            },
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        }
    );

    if (!currency.isBaseCurrency) {
        throw new Error(
            "Configured currency exists but is not marked as the base currency"
        );
    }

    let accountsCreatedOrFound = 0;

    for (const account of accountDefinitions) {
        await ChartOfAccounts.findOneAndUpdate(
            {
                tenantId,
                accountCode: account.accountCode,
            },
            {
                $setOnInsert: {
                    tenantId,
                    ...account,
                    isActive: true,
                },
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        );

        accountsCreatedOrFound++;
    }

    return {
        currency,
        accountsCreatedOrFound,
        message: "Finance seed completed successfully",
    };
};