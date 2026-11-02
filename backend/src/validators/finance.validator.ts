
import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import type { AccountType } from "../models/finance/ChartOfAccounts.js";
import type { InvoiceStatus } from "../models/finance/Invoice.js";
import type {
    PaymentStatus,
    PaymentMethod,
} from "../models/finance/Payment.js";

type ValidationMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => void;

const ACCOUNT_TYPES: AccountType[] = [
    "asset",
    "liability",
    "equity",
    "revenue",
    "expense",
];

const INVOICE_STATUSES: InvoiceStatus[] = [
    "draft",
    "pending",
    "partially_paid",
    "paid",
    "overdue",
    "cancelled",
];

const PAYMENT_STATUSES: PaymentStatus[] = [
    "pending",
    "completed",
    "failed",
    "cancelled",
];

const PAYMENT_METHODS: PaymentMethod[] = [
    "cash",
    "bank_transfer",
    "cheque",
    "credit_card",
    "other",
];

const DECIMAL_PATTERN = /^\d+(\.\d{1,18})?$/;


function sendValidationError(
    res: Response,
    message: string
): void {
    res.status(400).json({
        success: false,
        message,
    });
}

function isRecord(
    value: unknown
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function isNonEmptyString(value: unknown): value is string {
    return (
        typeof value === "string" &&
        value.trim().length > 0
    );
}

function isOptionalString(value: unknown): boolean {
    return value === undefined || typeof value === "string";
}

function isValidDate(value: unknown): boolean {
    if (typeof value !== "string" || !value.trim()) {
        return false;
    }

    return !Number.isNaN(new Date(value).getTime());
}

function isDecimalString(value: unknown): value is string {
    return (
        typeof value === "string" &&
        DECIMAL_PATTERN.test(value)
    );
}

function isPositiveDecimalInput(value: unknown): boolean {
    if (typeof value === "number") {
        return Number.isFinite(value) && value > 0;
    }

    if (typeof value !== "string" || !DECIMAL_PATTERN.test(value)) {
        return false;
    }

    return Number(value) > 0;
}

function isValidId(value: unknown): value is string {
    return (
        typeof value === "string" &&
        mongoose.isValidObjectId(value)
    );
}

function hasOnlyAllowedFields(
    body: Record<string, unknown>,
    allowedFields: string[]
): boolean {
    return Object.keys(body).every((field) =>
        allowedFields.includes(field)
    );
}

function getParam(
    req: Request,
    paramName: string
): string | undefined {
    const value = req.params[paramName];

    return typeof value === "string" && value.trim()
        ? value.trim()
        : undefined;
}

function validateParamId(
    paramName: string,
    errorMessage: string
): ValidationMiddleware {
    return (req, res, next) => {
        const id = getParam(req, paramName);

        if (!id || !isValidId(id)) {
            sendValidationError(res, errorMessage);
            return;
        }

        next();
    };
}

function validateStatusQuery(
    req: Request,
    res: Response,
    next: NextFunction,
    allowedStatuses: string[],
    errorMessage: string
): void {
    const status = req.query.status;

    if (
        status !== undefined &&
        (
            typeof status !== "string" ||
            !allowedStatuses.includes(status)
        )
    ) {
        sendValidationError(res, errorMessage);
        return;
    }

    next();
}


export const validateCreateAccount: ValidationMiddleware = (
    req,
    res,
    next
) => {
    const body: unknown = req.body;

    if (!isRecord(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    const allowedFields = [
        "accountCode",
        "accountName",
        "accountType",
        "description",
        "parentAccount",
        "isActive",
    ];

    if (!hasOnlyAllowedFields(body, allowedFields)) {
        sendValidationError(res, "UNEXPECTED_ACCOUNT_FIELD");
        return;
    }

    if (
        !isNonEmptyString(body.accountCode) ||
        !isNonEmptyString(body.accountName)
    ) {
        sendValidationError(res, "ACCOUNT_CODE_AND_NAME_REQUIRED");
        return;
    }

    if (
        typeof body.accountType !== "string" ||
        !ACCOUNT_TYPES.includes(body.accountType as AccountType)
    ) {
        sendValidationError(res, "INVALID_ACCOUNT_TYPE");
        return;
    }

    if (!isOptionalString(body.description)) {
        sendValidationError(res, "INVALID_DESCRIPTION");
        return;
    }

    if (
        body.parentAccount !== undefined &&
        !isValidId(body.parentAccount)
    ) {
        sendValidationError(res, "INVALID_PARENT_ACCOUNT_ID");
        return;
    }

    if (
        body.isActive !== undefined &&
        typeof body.isActive !== "boolean"
    ) {
        sendValidationError(res, "INVALID_ACCOUNT_STATUS");
        return;
    }

    next();
};

export const validateUpdateAccount: ValidationMiddleware = (
    req,
    res,
    next
) => {
    const body: unknown = req.body;

    if (!isRecord(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    const allowedFields = [
        "accountCode",
        "accountName",
        "accountType",
        "description",
        "parentAccount",
        "isActive",
    ];

    if (!hasOnlyAllowedFields(body, allowedFields)) {
        sendValidationError(res, "UNEXPECTED_ACCOUNT_FIELD");
        return;
    }

    if (Object.keys(body).length === 0) {
        sendValidationError(res, "NO_ACCOUNT_FIELDS_TO_UPDATE");
        return;
    }

    if (
        body.accountCode !== undefined &&
        !isNonEmptyString(body.accountCode)
    ) {
        sendValidationError(res, "INVALID_ACCOUNT_CODE");
        return;
    }

    if (
        body.accountName !== undefined &&
        !isNonEmptyString(body.accountName)
    ) {
        sendValidationError(res, "INVALID_ACCOUNT_NAME");
        return;
    }

    if (
        body.accountType !== undefined &&
        (
            typeof body.accountType !== "string" ||
            !ACCOUNT_TYPES.includes(body.accountType as AccountType)
        )
    ) {
        sendValidationError(res, "INVALID_ACCOUNT_TYPE");
        return;
    }

    if (!isOptionalString(body.description)) {
        sendValidationError(res, "INVALID_DESCRIPTION");
        return;
    }

    if (
        body.parentAccount !== undefined &&
        body.parentAccount !== null &&
        !isValidId(body.parentAccount)
    ) {
        sendValidationError(res, "INVALID_PARENT_ACCOUNT_ID");
        return;
    }

    if (
        body.isActive !== undefined &&
        typeof body.isActive !== "boolean"
    ) {
        sendValidationError(res, "INVALID_ACCOUNT_STATUS");
        return;
    }

    next();
};

export const validateAccountId = validateParamId(
    "accountId",
    "INVALID_ACCOUNT_ID"
);


export const validateCreateJournalEntry: ValidationMiddleware = (
    req,
    res,
    next
) => {
    const body: unknown = req.body;

    if (!isRecord(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    const allowedFields = [
        "journalNumber",
        "entryDate",
        "description",
        "reference",
        "entries",
    ];

    if (!hasOnlyAllowedFields(body, allowedFields)) {
        sendValidationError(res, "UNEXPECTED_JOURNAL_FIELD");
        return;
    }

    if (
        !isNonEmptyString(body.journalNumber) ||
        !isNonEmptyString(body.description)
    ) {
        sendValidationError(
            res,
            "JOURNAL_NUMBER_AND_DESCRIPTION_REQUIRED"
        );
        return;
    }

    if (!isValidDate(body.entryDate)) {
        sendValidationError(res, "INVALID_JOURNAL_ENTRY_DATE");
        return;
    }

    if (!isOptionalString(body.reference)) {
        sendValidationError(res, "INVALID_JOURNAL_REFERENCE");
        return;
    }

    if (!Array.isArray(body.entries) || body.entries.length < 2) {
        sendValidationError(
            res,
            "JOURNAL_REQUIRES_AT_LEAST_TWO_LINES"
        );
        return;
    }

    const validEntries = body.entries.every((entry: unknown) => {
        if (!isRecord(entry)) {
            return false;
        }

        if (
            !hasOnlyAllowedFields(entry, [
                "accountId",
                "description",
                "debit",
                "credit",
            ])
        ) {
            return false;
        }

        return (
            isValidId(entry.accountId) &&
            isDecimalString(entry.debit) &&
            isDecimalString(entry.credit) &&
            isOptionalString(entry.description)
        );
    });

    if (!validEntries) {
        sendValidationError(res, "INVALID_JOURNAL_LINE");
        return;
    }

    next();
};

export const validateJournalId = validateParamId(
    "journalId",
    "INVALID_JOURNAL_ID"
);

export const validateReverseJournalEntry: ValidationMiddleware = (
    req,
    res,
    next
) => {
    const body: unknown = req.body;

    if (
        !isRecord(body) ||
        !hasOnlyAllowedFields(body, ["reversalJournalNumber"]) ||
        !isNonEmptyString(body.reversalJournalNumber)
    ) {
        sendValidationError(
            res,
            "REVERSAL_JOURNAL_NUMBER_REQUIRED"
        );
        return;
    }

    next();
};


export const validateCreateInvoice: ValidationMiddleware = (
    req,
    res,
    next
) => {
    const body: unknown = req.body;

    if (!isRecord(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    const allowedFields = [
        "invoiceNumber",
        "partyName",
        "partyEmail",
        "invoiceDate",
        "dueDate",
        "description",
        "items",
        "subtotal",
        "taxAmount",
        "totalAmount",
    ];

    if (!hasOnlyAllowedFields(body, allowedFields)) {
        sendValidationError(res, "UNEXPECTED_INVOICE_FIELD");
        return;
    }

    if (
        !isNonEmptyString(body.invoiceNumber) ||
        !isNonEmptyString(body.partyName) ||
        !isValidDate(body.invoiceDate) ||
        !isValidDate(body.dueDate)
    ) {
        sendValidationError(res, "INVALID_INVOICE_DETAILS");
        return;
    }

    if (
        !isOptionalString(body.partyEmail) ||
        !isOptionalString(body.description)
    ) {
        sendValidationError(
            res,
            "INVALID_INVOICE_OPTIONAL_FIELDS"
        );
        return;
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
        sendValidationError(res, "INVALID_INVOICE_ITEMS");
        return;
    }

    const validItems = body.items.every((item: unknown) => {
        if (!isRecord(item)) {
            return false;
        }

        if (
            !hasOnlyAllowedFields(item, [
                "description",
                "quantity",
                "unitPrice",
                "amount",
            ])
        ) {
            return false;
        }

        return (
            isNonEmptyString(item.description) &&
            isDecimalString(item.quantity) &&
            isDecimalString(item.unitPrice) &&
            isDecimalString(item.amount)
        );
    });

    if (!validItems) {
        sendValidationError(res, "INVALID_INVOICE_ITEMS");
        return;
    }

    if (
        !isDecimalString(body.subtotal) ||
        !isDecimalString(body.taxAmount) ||
        !isDecimalString(body.totalAmount)
    ) {
        sendValidationError(res, "INVALID_INVOICE_AMOUNTS");
        return;
    }

    next();
};

export const validateInvoiceStatusQuery: ValidationMiddleware = (
    req,
    res,
    next
) => {
    validateStatusQuery(
        req,
        res,
        next,
        INVOICE_STATUSES,
        "INVALID_INVOICE_STATUS"
    );
};

export const validateInvoiceId = validateParamId(
    "invoiceId",
    "INVALID_INVOICE_ID"
);


export const validateRecordPayment: ValidationMiddleware = (
    req,
    res,
    next
) => {
    const body: unknown = req.body;

    if (!isRecord(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    const allowedFields = [
        "invoiceId",
        "paymentNumber",
        "partyName",
        "paymentDate",
        "amount",
        "paymentMethod",
        "transactionReference",
        "description",
    ];

    if (!hasOnlyAllowedFields(body, allowedFields)) {
        sendValidationError(res, "UNEXPECTED_PAYMENT_FIELD");
        return;
    }

    if (
        !isValidId(body.invoiceId) ||
        !isNonEmptyString(body.paymentNumber) ||
        !isNonEmptyString(body.partyName) ||
        !isValidDate(body.paymentDate) ||
        !isDecimalString(body.amount)
    ) {
        sendValidationError(res, "INVALID_PAYMENT_DETAILS");
        return;
    }

    if (
        typeof body.paymentMethod !== "string" ||
        !PAYMENT_METHODS.includes(body.paymentMethod as PaymentMethod)
    ) {
        sendValidationError(res, "INVALID_PAYMENT_METHOD");
        return;
    }

    if (
        !isOptionalString(body.transactionReference) ||
        !isOptionalString(body.description)
    ) {
        sendValidationError(
            res,
            "INVALID_PAYMENT_OPTIONAL_FIELDS"
        );
        return;
    }

    next();
};

export const validatePaymentStatusQuery: ValidationMiddleware = (
    req,
    res,
    next
) => {
    validateStatusQuery(
        req,
        res,
        next,
        PAYMENT_STATUSES,
        "INVALID_PAYMENT_STATUS"
    );
};

export const validatePaymentId = validateParamId(
    "paymentId",
    "INVALID_PAYMENT_ID"
);

export const validateUpdatePaymentStatus: ValidationMiddleware = (
    req,
    res,
    next
) => {
    const body: unknown = req.body;

    if (
        !isRecord(body) ||
        !hasOnlyAllowedFields(body, ["status"]) ||
        typeof body.status !== "string" ||
        !PAYMENT_STATUSES.includes(body.status as PaymentStatus)
    ) {
        sendValidationError(res, "INVALID_PAYMENT_STATUS");
        return;
    }

    next();
};


export const validateCreateCurrency: ValidationMiddleware = (
    req,
    res,
    next
) => {
    const body: unknown = req.body;

    if (!isRecord(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    const allowedFields = [
        "code",
        "name",
        "symbol",
        "exchangeRate",
        "isBaseCurrency",
    ];

    if (!hasOnlyAllowedFields(body, allowedFields)) {
        sendValidationError(res, "UNEXPECTED_CURRENCY_FIELD");
        return;
    }

    if (
        !isNonEmptyString(body.code) ||
        !isNonEmptyString(body.name) ||
        !isNonEmptyString(body.symbol)
    ) {
        sendValidationError(
            res,
            "Currency code, name and symbol are required"
        );
        return;
    }

    if (
        body.exchangeRate !== undefined &&
        !isPositiveDecimalInput(body.exchangeRate)
    ) {
        sendValidationError(res, "INVALID_EXCHANGE_RATE");
        return;
    }

    if (
        body.isBaseCurrency !== undefined &&
        typeof body.isBaseCurrency !== "boolean"
    ) {
        sendValidationError(res, "INVALID_BASE_CURRENCY_STATUS");
        return;
    }

    next();
};

export const validateActiveOnlyQuery: ValidationMiddleware = (
    req,
    res,
    next
) => {
    const activeOnly = req.query.activeOnly;

    if (
        activeOnly !== undefined &&
        activeOnly !== "true" &&
        activeOnly !== "false"
    ) {
        sendValidationError(res, "INVALID_ACTIVE_ONLY_FILTER");
        return;
    }

    next();
};

export const validateCurrencyId = validateParamId(
    "currencyId",
    "INVALID_CURRENCY_ID"
);

export const validateCurrencyCode: ValidationMiddleware = (
    req,
    res,
    next
) => {
    const code = getParam(req, "code");

    if (!code || !/^[A-Za-z]{3}$/.test(code)) {
        sendValidationError(res, "INVALID_CURRENCY_CODE");
        return;
    }

    next();
};

export const validateUpdateExchangeRate: ValidationMiddleware = (
    req,
    res,
    next
) => {
    const body: unknown = req.body;

    if (
        !isRecord(body) ||
        !hasOnlyAllowedFields(body, ["exchangeRate"]) ||
        !isPositiveDecimalInput(body.exchangeRate)
    ) {
        sendValidationError(res, "INVALID_EXCHANGE_RATE");
        return;
    }

    next();
};
