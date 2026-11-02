
import mongoose, { type ClientSession } from "mongoose";

import Inventory from "../../models/supplyChain/Inventory.js";
import type { IInventory } from "../../models/supplyChain/Inventory.js";

export async function createInventoryItem(
    inventoryData: Partial<IInventory>
) {
    return Inventory.create(inventoryData);
}

export async function getInventoryByTenant(tenantId: string) {
    return Inventory.find({ tenantId })
        .populate("tenantId", "name code")
        .sort({ createdAt: -1 });
}

export async function getInventoryByIdAndTenant(
    inventoryId: string,
    tenantId: string
) {
    return Inventory.findOne({
        _id: inventoryId,
        tenantId,
    }).populate("tenantId", "name code");
}

export async function getInventoryByCodeAndTenant(
    itemCode: string,
    tenantId: string
) {
    return Inventory.findOne({
        itemCode: itemCode.trim().toUpperCase(),
        tenantId,
    });
}

export async function updateInventoryByIdAndTenant(
    inventoryId: string,
    tenantId: string,
    updateData: Partial<IInventory>
) {
    return Inventory.findOneAndUpdate(
        {
            _id: inventoryId,
            tenantId,
        },
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );
}

// Increase inventory stock within a MongoDB transaction.
export async function incrementInventoryQuantityByIdAndTenant(
    inventoryId: string,
    tenantId: string,
    quantity: number,
    session: ClientSession
) {
    return Inventory.findOneAndUpdate(
        {
            _id: inventoryId,
            tenantId: new mongoose.Types.ObjectId(tenantId),
            status: "active",
        },
        {
            $inc: {
                quantity,
            },
        },
        {
            new: true,
            runValidators: true,
            session,
        }
    );
}

export async function deleteInventoryByIdAndTenant(
    inventoryId: string,
    tenantId: string
) {
    return Inventory.findOneAndDelete({
        _id: inventoryId,
        tenantId,
    });
}

export async function getInventoryItemsForReorder(
    tenantId: string
) {
    return Inventory.find({
        tenantId: new mongoose.Types.ObjectId(tenantId),
        status: "active",
        reorderLevel: { $gt: 0 },
    }).sort({
        name: 1,
    });
}