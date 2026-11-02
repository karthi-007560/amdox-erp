import { createForecastService } from "../services/supplyChain/forecastingService.js";

export type ForecastJobInput = Parameters<
    typeof createForecastService
>[0];

export interface ForecastingJobResult {
    total: number;
    successful: number;
    failed: number;
    results: Awaited<ReturnType<typeof createForecastService>>[];
    errors: string[];
}

export async function runForecastingJob(
    forecasts: ForecastJobInput[]
): Promise<ForecastingJobResult> {
    const result: ForecastingJobResult = {
        total: forecasts.length,
        successful: 0,
        failed: 0,
        results: [],
        errors: [],
    };

    for (const forecast of forecasts) {
        try {
            const generatedForecast = await createForecastService(forecast);

            result.results.push(generatedForecast);
            result.successful++;
        } catch (error: unknown) {
            result.failed++;
            result.errors.push(
                `Forecast failed for inventory ${forecast.inventoryId}: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }

    return result;
}