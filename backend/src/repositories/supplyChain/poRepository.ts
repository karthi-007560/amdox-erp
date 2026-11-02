
import type { ClientSession } from "mongoose";

import PurchaseOrder from "../../models/supplyChain/PurchaseOrder.js";
import type { IPurchaseOrder } from "../../models/supplyChain/PurchaseOrder.js";

import GoodsReceipt from "../../models/supplyChain/GoodsReceipt.js";
import type { IGoodsReceipt } from "../../models/supplyChain/GoodsReceipt.js";

export async function createPurchaseOrder(
    purchaseOrderData: Partial<IPurchaseOrder>
) {
    return PurchaseOrder.create(purchaseOrderData);
}

export async function getPurchaseOrdersByTenant(
    tenantId: string
) {
    return PurchaseOrder.find({ tenantId })
        .populate("tenantId", "name code")
        .populate("vendorId", "vendorCode name email phone")
        .populate("items.inventoryId", "itemCode name unit")
        .sort({ createdAt: -1 });
}

export async function getPurchaseOrderByIdAndTenant(
    purchaseOrderId: string,
    tenantId: string
) {
    return PurchaseOrder.findOne({
        _id: purchaseOrderId,
        tenantId,
    })
        .populate("tenantId", "name code")
        .populate("vendorId", "vendorCode name email phone")
        .populate("items.inventoryId", "itemCode name unit");
}

export async function getPurchaseOrderByNumberAndTenant(
    poNumber: string,
    tenantId: string
) {
    return PurchaseOrder.findOne({
        poNumber: poNumber.trim().toUpperCase(),
        tenantId,
    });
}

export async function updatePurchaseOrderByIdAndTenant(
    purchaseOrderId: string,
    tenantId: string,
    updateData: Partial<IPurchaseOrder>
) {
    return PurchaseOrder.findOneAndUpdate(
        {
            _id: purchaseOrderId,
            tenantId,
        },
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );
}

export async function approvePurchaseOrderByIdAndTenant(
    purchaseOrderId: string,
    tenantId: string,
    approvedBy: string
) {
    return PurchaseOrder.findOneAndUpdate(
        {
            _id: purchaseOrderId,
            tenantId,
            status: "draft",
        },
        {
            $set: {
                status: "approved",
                approvedBy,
                approvedAt: new Date(),
            },
        },
        {
            new: true,
            runValidators: true,
        }
    );
}

export async function getPurchaseOrderByIdAndTenantWithSession(
    purchaseOrderId: string,
    tenantId: string,
    session: ClientSession
) {
    return PurchaseOrder.findOne({
        _id: purchaseOrderId,
        tenantId,
    }).session(session);
}

export async function savePurchaseOrderWithSession(
    purchaseOrder: IPurchaseOrder,
    session: ClientSession
) {
    return purchaseOrder.save({ session });
}

export async function createGoodsReceiptWithSession(
    receiptData: Partial<IGoodsReceipt>,
    session: ClientSession
) {
    const [receipt] = await GoodsReceipt.create(
        [receiptData],
        { session }
    );

    return receipt;
}


export async function getGoodsReceiptByIdAndTenant(
    goodsReceiptId: string,
    tenantId: string
) {
    return GoodsReceipt.findOne({
        _id: goodsReceiptId,
        tenantId,
    });
}


export async function getGoodsReceiptsByPurchaseOrderAndTenant(
    purchaseOrderId: string,
    tenantId: string
) {
    return GoodsReceipt.find({
        purchaseOrderId,
        tenantId,
        status: "received",
    }).sort({
        createdAt: 1,
    });
}

export async function deletePurchaseOrderByIdAndTenant(
    purchaseOrderId: string,
    tenantId: string
) {
    return PurchaseOrder.findOneAndDelete({
        _id: purchaseOrderId,
        tenantId,
    });
}
