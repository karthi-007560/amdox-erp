import mongoose from "mongoose";

import type {
    IInventory,
    InventoryStatus,
} from "../../models/supplyChain/Inventory.js";

import {
    createInventoryItem,
    getInventoryByTenant,
    getInventoryByIdAndTenant,
    getInventoryByCodeAndTenant,
    updateInventoryByIdAndTenant,
    deleteInventoryByIdAndTenant,
} from "../../repositories/supplyChain/inventoryRepository.js";

import {
    findTenantById,
} from "../../repositories/tenantRepository.js";

interface CreateInventoryInput {
    tenantId: string;
    itemCode: string;
    name: string;
    description?: string;
    category?: string;
    unit: string;
    quantity?: number;
    reservedQuantity?: number;
    reorderLevel?: number;
    unitCost?: number;
    warehouse?: string;
    status?: InventoryStatus;
    createdBy?: string;
}

interface UpdateInventoryInput {
    itemCode?: string;
    name?: string;
    description?: string;
    category?: string;
    unit?: string;
    quantity?: number;
    reservedQuantity?: number;
    reorderLevel?: number;
    unitCost?: number;
    warehouse?: string;
    status?: InventoryStatus;
}

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

function validateNonNegativeNumber(
    value: number,
    errorCode: string
): void {
    if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0
    ) {
        throw new Error(errorCode);
    }
}

function validateInventoryQuantities(
    quantity: number,
    reservedQuantity: number
): void {
    validateNonNegativeNumber(quantity, "INVALID_QUANTITY");
    validateNonNegativeNumber(
        reservedQuantity,
        "INVALID_RESERVED_QUANTITY"
    );

    if (reservedQuantity > quantity) {
        throw new Error("RESERVED_QUANTITY_EXCEEDS_STOCK");
    }
}

export async function createInventoryService(
    input: CreateInventoryInput
) {
    await validateActiveTenant(input.tenantId);

    const itemCode = input.itemCode?.trim().toUpperCase();
    const name = input.name?.trim();
    const unit = input.unit?.trim();

    if (!itemCode || !name || !unit) {
        throw new Error("ITEM_CODE_NAME_AND_UNIT_REQUIRED");
    }

    const existingItem = await getInventoryByCodeAndTenant(
        itemCode,
        input.tenantId
    );

    if (existingItem) {
        throw new Error("ITEM_CODE_ALREADY_EXISTS");
    }

    const quantity = input.quantity ?? 0;
    const reservedQuantity = input.reservedQuantity ?? 0;
    const reorderLevel = input.reorderLevel ?? 0;
    const unitCost = input.unitCost ?? 0;

    validateInventoryQuantities(quantity, reservedQuantity);
    validateNonNegativeNumber(reorderLevel, "INVALID_REORDER_LEVEL");
    validateNonNegativeNumber(unitCost, "INVALID_UNIT_COST");

    if (input.createdBy) {
        validateObjectId(input.createdBy, "INVALID_CREATED_BY");
    }

    const inventoryData: Partial<IInventory> = {
        tenantId: new mongoose.Types.ObjectId(input.tenantId),
        itemCode,
        name,
        description: input.description?.trim(),
        category: input.category?.trim(),
        unit,
        quantity,
        reservedQuantity,
        reorderLevel,
        unitCost,
        warehouse: input.warehouse?.trim(),
        status: input.status ?? "active",
    };

    if (input.createdBy) {
        inventoryData.createdBy = new mongoose.Types.ObjectId(
            input.createdBy
        );
    }

    return createInventoryItem(inventoryData);
}

export async function getInventoryByTenantService(
    tenantId: string
) {
    await validateActiveTenant(tenantId);

    return getInventoryByTenant(tenantId);
}

export async function getInventoryByIdService(
    inventoryId: string,
    tenantId: string
) {
    validateObjectId(inventoryId, "INVALID_INVENTORY_ID");
    await validateActiveTenant(tenantId);

    const item = await getInventoryByIdAndTenant(
        inventoryId,
        tenantId
    );

    if (!item) {
        throw new Error("INVENTORY_ITEM_NOT_FOUND");
    }

    return item;
}

export async function updateInventoryService(
    inventoryId: string,
    tenantId: string,
    input: UpdateInventoryInput
) {
    validateObjectId(inventoryId, "INVALID_INVENTORY_ID");
    await validateActiveTenant(tenantId);

    const existingItem = await getInventoryByIdAndTenant(
        inventoryId,
        tenantId
    );

    if (!existingItem) {
        throw new Error("INVENTORY_ITEM_NOT_FOUND");
    }

    const updateData: Partial<IInventory> = {};

    if (input.itemCode !== undefined) {
        const itemCode = input.itemCode.trim().toUpperCase();

        if (!itemCode) {
            throw new Error("ITEM_CODE_REQUIRED");
        }

        const duplicateItem = await getInventoryByCodeAndTenant(
            itemCode,
            tenantId
        );

        if (
            duplicateItem &&
            duplicateItem._id.toString() !== inventoryId
        ) {
            throw new Error("ITEM_CODE_ALREADY_EXISTS");
        }

        updateData.itemCode = itemCode;
    }

    if (input.name !== undefined) {
        const name = input.name.trim();

        if (!name) {
            throw new Error("ITEM_NAME_REQUIRED");
        }

        updateData.name = name;
    }

    if (input.description !== undefined) {
        updateData.description = input.description.trim();
    }

    if (input.category !== undefined) {
        updateData.category = input.category.trim();
    }

    if (input.unit !== undefined) {
        const unit = input.unit.trim();

        if (!unit) {
            throw new Error("UNIT_REQUIRED");
        }

        updateData.unit = unit;
    }

    if (input.quantity !== undefined) {
        validateNonNegativeNumber(
            input.quantity,
            "INVALID_QUANTITY"
        );
        updateData.quantity = input.quantity;
    }

    if (input.reservedQuantity !== undefined) {
        validateNonNegativeNumber(
            input.reservedQuantity,
            "INVALID_RESERVED_QUANTITY"
        );
        updateData.reservedQuantity = input.reservedQuantity;
    }

    if (input.reorderLevel !== undefined) {
        validateNonNegativeNumber(
            input.reorderLevel,
            "INVALID_REORDER_LEVEL"
        );
        updateData.reorderLevel = input.reorderLevel;
    }

    if (input.unitCost !== undefined) {
        validateNonNegativeNumber(
            input.unitCost,
            "INVALID_UNIT_COST"
        );
        updateData.unitCost = input.unitCost;
    }

    if (input.warehouse !== undefined) {
        updateData.warehouse = input.warehouse.trim();
    }

    if (input.status !== undefined) {
        updateData.status = input.status;
    }

    const finalQuantity = updateData.quantity ?? existingItem.quantity;
    const finalReservedQuantity =
        updateData.reservedQuantity ?? existingItem.reservedQuantity;

    validateInventoryQuantities(
        finalQuantity,
        finalReservedQuantity
    );

    if (Object.keys(updateData).length === 0) {
        throw new Error("NO_INVENTORY_FIELDS_TO_UPDATE");
    }

    const updatedItem = await updateInventoryByIdAndTenant(
        inventoryId,
        tenantId,
        updateData
    );

    if (!updatedItem) {
        throw new Error("INVENTORY_UPDATE_FAILED");
    }

    return updatedItem;
}

export async function deleteInventoryService(
    inventoryId: string,
    tenantId: string
) {
    validateObjectId(inventoryId, "INVALID_INVENTORY_ID");
    await validateActiveTenant(tenantId);

    const deletedItem = await deleteInventoryByIdAndTenant(
        inventoryId,
        tenantId
    );

    if (!deletedItem) {
        throw new Error("INVENTORY_ITEM_NOT_FOUND");
    }

    return deletedItem;
}