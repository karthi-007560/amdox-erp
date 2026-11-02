import Forecast from "../../models/supplyChain/Forecast.js";
import type { IForecast } from "../../models/supplyChain/Forecast.js";

export async function createForecast(
    forecastData: Partial<IForecast>
) {
    return Forecast.create(forecastData);
}

export async function getForecastsByTenant(
    tenantId: string
) {
    return Forecast.find({ tenantId })
        .populate("tenantId", "name code")
        .populate("inventoryId", "itemCode name unit quantity")
        .populate("generatedBy", "name email")
        .sort({ createdAt: -1 });
}

export async function getForecastByIdAndTenant(
    forecastId: string,
    tenantId: string
) {
    return Forecast.findOne({
        _id: forecastId,
        tenantId,
    })
        .populate("tenantId", "name code")
        .populate("inventoryId", "itemCode name unit quantity")
        .populate("generatedBy", "name email");
}

export async function deleteForecastByIdAndTenant(
    forecastId: string,
    tenantId: string
) {
    return Forecast.findOneAndDelete({
        _id: forecastId,
        tenantId,
    });
}