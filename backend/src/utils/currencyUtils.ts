export type NumericValue =
    | number
    | string
    | { toString(): string };

export function toNumber(value: NumericValue): number {
    const result = Number(value.toString());

    if (!Number.isFinite(result)) {
        throw new Error("Invalid numeric value.");
    }

    return result;
}

export function formatCurrency(
    amount: NumericValue,
    currencyCode = "INR",
    locale = "en-IN"
): string {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
    }).format(toNumber(amount));
}

export function convertCurrency(
    amount: NumericValue,
    exchangeRate: NumericValue
): number {
    const rate = toNumber(exchangeRate);

    if (rate <= 0) {
        throw new Error("Exchange rate must be greater than zero.");
    }

    return toNumber(amount) * rate;
}

export function roundCurrency(
    amount: NumericValue,
    decimalPlaces = 2
): number {
    if (
        !Number.isInteger(decimalPlaces) ||
        decimalPlaces < 0 ||
        decimalPlaces > 10
    ) {
        throw new Error("Decimal places must be between 0 and 10.");
    }

    const factor = 10 ** decimalPlaces;

    return Math.round(
        (toNumber(amount) + Number.EPSILON) * factor
    ) / factor;
}

export function calculatePercentage(
    amount: NumericValue,
    percentage: NumericValue
): number {
    return (
        toNumber(amount) *
        toNumber(percentage)
    ) / 100;
}

export function calculateTax(
    amount: NumericValue,
    taxRate: NumericValue
): number {
    return roundCurrency(
        calculatePercentage(amount, taxRate)
    );
}