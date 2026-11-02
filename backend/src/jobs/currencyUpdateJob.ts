
import { Tenant } from "../models/Tenant.js";
import {
    getCurrenciesService,
    updateCurrencyExchangeRateService,
} from "../services/finance/currencyService.js";
import { getExchangeRates } from "../services/external/currencyApiService.js";

interface CurrencyUpdateJobResult {
    startedAt: Date;
    completedAt: Date;
    tenantsProcessed: number;
    currenciesUpdated: number;
    currenciesSkipped: number;
    errors: string[];
}

export async function runCurrencyUpdateJob(): Promise<CurrencyUpdateJobResult> {
    const startedAt = new Date();

    const result: CurrencyUpdateJobResult = {
        startedAt,
        completedAt: startedAt,
        tenantsProcessed: 0,
        currenciesUpdated: 0,
        currenciesSkipped: 0,
        errors: [],
    };

    const tenants = await Tenant.find({
        status: "active",
    }).select("_id");

    for (const tenant of tenants) {
        const tenantId = tenant._id.toString();

        try {
            const currencies = await getCurrenciesService(
                tenantId,
                true
            );

            if (currencies.length === 0) {
                result.currenciesSkipped++;
                continue;
            }

            const baseCurrency = currencies.find(
                (currency) => currency.isBaseCurrency
            );

            if (!baseCurrency) {
                result.errors.push(
                    `Tenant ${tenantId}: Base currency not configured.`
                );
                continue;
            }

            const exchangeData = await getExchangeRates(
                baseCurrency.code
            );

            if (
                exchangeData.baseCurrency.toUpperCase() !==
                baseCurrency.code.toUpperCase()
            ) {
                throw new Error(
                    `Unexpected base currency returned by exchange API: ${exchangeData.baseCurrency}`
                );
            }

            for (const currency of currencies) {
                if (currency.isBaseCurrency) {
                    continue;
                }

                const rate = exchangeData.rates[currency.code];

                if (
                    typeof rate !== "number" ||
                    !Number.isFinite(rate) ||
                    rate <= 0
                ) {
                    result.currenciesSkipped++;
                    result.errors.push(
                        `Tenant ${tenantId}: Exchange rate unavailable for ${currency.code}.`
                    );
                    continue;
                }

                try {
                    await updateCurrencyExchangeRateService(
                        currency._id.toString(),
                        tenantId,
                        String(rate)
                    );

                    result.currenciesUpdated++;
                } catch (error: unknown) {
                    result.errors.push(
                        `Tenant ${tenantId}, currency ${currency.code}: ${
                            error instanceof Error
                                ? error.message
                                : String(error)
                        }`
                    );
                }
            }

            result.tenantsProcessed++;
        } catch (error: unknown) {
            result.errors.push(
                `Tenant ${tenantId}: ${
                    error instanceof Error
                        ? error.message
                        : String(error)
                }`
            );
        }
    }

    result.completedAt = new Date();

    return result;
}
