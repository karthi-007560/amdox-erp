interface CurrencyApiResponse {
    result?: string;
    base_code?: string;
    rates?: Record<string, number>;
    time_last_update_utc?: string;
}

export interface ExchangeRateResult {
    baseCurrency: string;
    rates: Record<string, number>;
    lastUpdated?: string;
}

function normalizeCurrencyCode(code: string): string {
    const normalized = code.trim().toUpperCase();

    if (!/^[A-Z]{3}$/.test(normalized)) {
        throw new Error(`Invalid currency code: ${code}`);
    }

    return normalized;
}

export async function getExchangeRates(
    baseCurrency: string
): Promise<ExchangeRateResult> {
    const base = normalizeCurrencyCode(baseCurrency);

    const configuredUrl = process.env.CURRENCY_API_URL ||
        "https://open.er-api.com/v6/latest";

    const endpoint = configuredUrl.includes("{base}")
        ? configuredUrl.replace("{base}", encodeURIComponent(base))
        : `${configuredUrl.replace(/\/+$/, "")}/${encodeURIComponent(base)}`;

    const response = await fetch(endpoint);

    if (!response.ok) {
        throw new Error(
            `Currency API request failed with status ${response.status}.`
        );
    }

    const data = await response.json() as CurrencyApiResponse;

    if (
        data.result !== "success" ||
        !data.rates ||
        typeof data.rates !== "object"
    ) {
        throw new Error("Invalid response received from currency API.");
    }

    return {
        baseCurrency: data.base_code || base,
        rates: data.rates,
        ...(data.time_last_update_utc
            ? { lastUpdated: data.time_last_update_utc }
            : {}),
    };
}

export async function getExchangeRate(
    fromCurrency: string,
    toCurrency: string
): Promise<number> {
    const from = normalizeCurrencyCode(fromCurrency);
    const to = normalizeCurrencyCode(toCurrency);

    if (from === to) {
        return 1;
    }

    const result = await getExchangeRates(from);
    const rate = result.rates[to];

    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
        throw new Error(
            `Exchange rate from ${from} to ${to} is unavailable.`
        );
    }

    return rate;
}

export async function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
): Promise<number> {
    if (!Number.isFinite(amount)) {
        throw new Error("A valid amount is required.");
    }

    const rate = await getExchangeRate(fromCurrency, toCurrency);

    return Number((amount * rate).toFixed(2));
}