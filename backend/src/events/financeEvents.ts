export const FINANCE_EVENTS = {
    INVOICE_CREATED: "finance.invoice_created",
    INVOICE_ISSUED: "finance.invoice_issued",
    INVOICE_PAID: "finance.invoice_paid",
    PAYMENT_RECEIVED: "finance.payment_received",
    PAYMENT_MADE: "finance.payment_made",
    JOURNAL_CREATED: "finance.journal_created",
    JOURNAL_REVERSED: "finance.journal_reversed",
} as const;

export interface FinanceEventPayload {
    tenantId: string;
    actorId?: string;
    invoiceId?: string;
    paymentId?: string;
    journalEntryId?: string;
    amount?: number;
    currencyCode?: string;
    reference?: string;
    metadata?: Record<string, unknown>;
}

export interface FinanceEventMap {
    [FINANCE_EVENTS.INVOICE_CREATED]: FinanceEventPayload;
    [FINANCE_EVENTS.INVOICE_ISSUED]: FinanceEventPayload;
    [FINANCE_EVENTS.INVOICE_PAID]: FinanceEventPayload;
    [FINANCE_EVENTS.PAYMENT_RECEIVED]: FinanceEventPayload;
    [FINANCE_EVENTS.PAYMENT_MADE]: FinanceEventPayload;
    [FINANCE_EVENTS.JOURNAL_CREATED]: FinanceEventPayload;
    [FINANCE_EVENTS.JOURNAL_REVERSED]: FinanceEventPayload;
}