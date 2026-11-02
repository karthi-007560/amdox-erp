import mongoose from "mongoose";

import {
    getInventoryItemsForReorder,
} from "../../repositories/supplyChain/inventoryRepository.js";

import {
    findTenantById,
} from "../../repositories/tenantRepository.js";

function validateObjectId(
    id: string,
    errorCode: string
): void {
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

export async function getReorderSuggestionsService(
    tenantId: string
) {
    await validateActiveTenant(tenantId);

    const inventoryItems =
        await getInventoryItemsForReorder(tenantId);

    const reorderSuggestions = inventoryItems
        .map((item) => {
            const availableStock =
                item.quantity - item.reservedQuantity;

            const needsReordering =
                availableStock < item.reorderLevel;

            if (!needsReordering) {
                return null;
            }

            return {
                inventoryId: item._id,
                itemCode: item.itemCode,
                name: item.name,
                category: item.category,
                unit: item.unit,
                warehouse: item.warehouse,
                currentQuantity: item.quantity,
                reservedQuantity: item.reservedQuantity,
                availableStock,
                reorderLevel: item.reorderLevel,
                suggestedReorderQuantity:
                    item.reorderLevel - availableStock,
                unitCost: item.unitCost,
                estimatedReorderCost:
                    Number(
                        (
                            (item.reorderLevel - availableStock) *
                            item.unitCost
                        ).toFixed(2)
                    ),
            };
        })
        .filter((item) => item !== null);

    const totalEstimatedCost = Number(
        reorderSuggestions.reduce(
            (total, item) =>
                total + item.estimatedReorderCost,
            0
        ).toFixed(2)
    );

    return {
        count: reorderSuggestions.length,
        totalEstimatedCost,
        data: reorderSuggestions,
    };
}