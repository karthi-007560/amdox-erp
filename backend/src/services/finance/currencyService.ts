import { Types } from "mongoose";

import { Currency } from "../../models/finance/Currency.js";
import { findTenantById } from "../../repositories/tenantRepository.js";

type CreateCurrencyInput = {
    tenantId: string;
    code: string;
    name: string;
    symbol: string;
    exchangeRate?: string;
    isBaseCurrency?: boolean;
};

const validateObjectId = (id: string, fieldName: string): void => {
    if (!Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

const validateActiveTenant = async (tenantId: string): Promise<void> => {
    validateObjectId(tenantId, "tenant ID");

    const tenant = await findTenantById(tenantId);

    if (!tenant || tenant.status !== "active") {
        throw new Error("Tenant not found or inactive");
    }
};

const validateCurrencyCode = (code: string): string => {
    const normalizedCode = code.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(normalizedCode)) {
        throw new Error("Currency code must contain exactly 3 letters");
    }

    return normalizedCode;
};

const validateExchangeRate = (rate: string): string => {
    const normalizedRate = rate.trim();

    if (!/^\d+(\.\d+)?$/.test(normalizedRate)) {
        throw new Error("Invalid exchange rate");
    }

    if (Number(normalizedRate) <= 0) {
        throw new Error("Exchange rate must be greater than zero");
    }

    return normalizedRate;
};

export const createCurrencyService = async (
    input: CreateCurrencyInput
) => {
    const {
        tenantId,
        code,
        name,
        symbol,
        exchangeRate = "1",
        isBaseCurrency = false,
    } = input;

    await validateActiveTenant(tenantId);

    if (!name.trim() || !symbol.trim()) {
        throw new Error("Currency name and symbol are required");
    }

    const normalizedCode = validateCurrencyCode(code);
    const normalizedRate = validateExchangeRate(exchangeRate);

    const existingCurrency = await Currency.findOne({
        tenantId,
        code: normalizedCode,
    });

    if (existingCurrency) {
        throw new Error("Currency already exists for this tenant");
    }

    if (isBaseCurrency) {
        const existingBaseCurrency = await Currency.findOne({
            tenantId,
            isBaseCurrency: true,
        });

        if (existingBaseCurrency) {
            throw new Error("A base currency already exists");
        }
    }

    return Currency.create({
        tenantId: new Types.ObjectId(tenantId),
        code: normalizedCode,
        name: name.trim(),
        symbol: symbol.trim(),
        exchangeRate: Types.Decimal128.fromString(normalizedRate),
        isBaseCurrency,
        isActive: true,
    });
};


export const getCurrenciesService = async (
    tenantId: string,
    activeOnly = false
) => {
    await validateActiveTenant(tenantId);

    const filter: Record<string, unknown> = {
        tenantId,
    };

    if (activeOnly) {
        filter.isActive = true;
    }

    return Currency.find(filter).sort({
        isBaseCurrency: -1,
        code: 1,
    });
};

// Get currency by ID
export const getCurrencyByIdService = async (
    currencyId: string,
    tenantId: string
) => {
    validateObjectId(currencyId, "currency ID");
    await validateActiveTenant(tenantId);

    const currency = await Currency.findOne({
        _id: currencyId,
        tenantId,
    });

    if (!currency) {
        throw new Error("Currency not found");
    }

    return currency;
};


export const getCurrencyByCodeService = async (
    code: string,
    tenantId: string
) => {
    await validateActiveTenant(tenantId);

    const normalizedCode = validateCurrencyCode(code);

    const currency = await Currency.findOne({
        tenantId,
        code: normalizedCode,
    });

    if (!currency) {
        throw new Error("Currency not found");
    }

    return currency;
};


export const updateCurrencyExchangeRateService = async (
    currencyId: string,
    tenantId: string,
    exchangeRate: string
) => {
    validateObjectId(currencyId, "currency ID");
    await validateActiveTenant(tenantId);

    const normalizedRate = validateExchangeRate(exchangeRate);

    const currency = await Currency.findOneAndUpdate(
        {
            _id: currencyId,
            tenantId,
            isActive: true,
        },
        {
            $set: {
                exchangeRate:
                    Types.Decimal128.fromString(normalizedRate),
            },
        },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!currency) {
        throw new Error("Active currency not found");
    }

    return currency;
};


export const setBaseCurrencyService = async (
    currencyId: string,
    tenantId: string
) => {
    validateObjectId(currencyId, "currency ID");
    await validateActiveTenant(tenantId);

    const currency = await Currency.findOne({
        _id: currencyId,
        tenantId,
        isActive: true,
    });

    if (!currency) {
        throw new Error("Active currency not found");
    }

    await Currency.updateMany(
        {
            tenantId,
            isBaseCurrency: true,
        },
        {
            $set: {
                isBaseCurrency: false,
            },
        }
    );

    return Currency.findOneAndUpdate(
        {
            _id: currencyId,
            tenantId,
            isActive: true,
        },
        {
            $set: {
                isBaseCurrency: true,
                exchangeRate: Types.Decimal128.fromString("1"),
            },
        },
        {
            new: true,
            runValidators: true,
        }
    );
};


export const deactivateCurrencyService = async (
    currencyId: string,
    tenantId: string
) => {
    validateObjectId(currencyId, "currency ID");
    await validateActiveTenant(tenantId);

    const currency = await Currency.findOne({
        _id: currencyId,
        tenantId,
    });

    if (!currency) {
        throw new Error("Currency not found");
    }

    if (currency.isBaseCurrency) {
        throw new Error("The base currency cannot be deactivated");
    }

    currency.isActive = false;

    await currency.save();

    return currency;
};


export const activateCurrencyService = async (
    currencyId: string,
    tenantId: string
) => {
    validateObjectId(currencyId, "currency ID");
    await validateActiveTenant(tenantId);

    const currency = await Currency.findOneAndUpdate(
        {
            _id: currencyId,
            tenantId,
        },
        {
            $set: {
                isActive: true,
            },
        },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!currency) {
        throw new Error("Currency not found");
    }

    return currency;
};
