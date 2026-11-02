
import mongoose from "mongoose";

import type {
    IPurchaseOrder,
    IPurchaseOrderItem,
} from "../../models/supplyChain/PurchaseOrder.js";

import type {
    IGoodsReceipt,
    IGoodsReceiptItem,
} from "../../models/supplyChain/GoodsReceipt.js";

import {
    createPurchaseOrder,
    getPurchaseOrdersByTenant,
    getPurchaseOrderByIdAndTenant,
    getPurchaseOrderByNumberAndTenant,
    updatePurchaseOrderByIdAndTenant,
    approvePurchaseOrderByIdAndTenant,
    deletePurchaseOrderByIdAndTenant,
    createGoodsReceiptWithSession,
    getPurchaseOrderByIdAndTenantWithSession,
    savePurchaseOrderWithSession,
} from "../../repositories/supplyChain/poRepository.js";

import {
    getVendorByIdAndTenant,
} from "../../repositories/supplyChain/vendorRepository.js";

import {
    getInventoryByIdAndTenant,
    incrementInventoryQuantityByIdAndTenant,
} from "../../repositories/supplyChain/inventoryRepository.js";

import {
    findTenantById,
} from "../../repositories/tenantRepository.js";

interface PurchaseOrderItemInput {
    inventoryId: string;
    quantity: number;
    unitCost: number;
}

interface CreatePurchaseOrderInput {
    tenantId: string;
    poNumber: string;
    vendorId: string;
    orderDate?: string | Date;
    expectedDeliveryDate?: string | Date;
    items: PurchaseOrderItemInput[];
    taxAmount?: number;
    notes?: string;
    createdBy?: string;
}

interface UpdatePurchaseOrderInput {
    vendorId?: string;
    orderDate?: string | Date;
    expectedDeliveryDate?: string | Date;
    items?: PurchaseOrderItemInput[];
    taxAmount?: number;
    notes?: string;
}

interface GoodsReceiptItemInput {
    inventoryId: string;
    receivedQuantity: number;
}

interface CreateGoodsReceiptInput {
    tenantId: string;
    purchaseOrderId: string;
    receiptNumber: string;
    items: GoodsReceiptItemInput[];
    receiptDate?: string | Date;
    notes?: string;
    receivedBy?: string;
}

function validateObjectId(
    id: string,
    errorCode: string
): void {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error(errorCode);
    }
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

function validatePositiveNumber(
    value: number,
    errorCode: string
): void {
    if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value <= 0
    ) {
        throw new Error(errorCode);
    }
}

function parseDate(
    value: string | Date,
    errorCode: string
): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new Error(errorCode);
    }

    return date;
}

function roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
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

async function validateActiveVendor(
    vendorId: string,
    tenantId: string
) {
    validateObjectId(vendorId, "INVALID_VENDOR_ID");

    const vendor = await getVendorByIdAndTenant(
        vendorId,
        tenantId
    );

    if (!vendor) {
        throw new Error("VENDOR_NOT_FOUND");
    }

    if (vendor.status !== "active") {
        throw new Error("VENDOR_NOT_ACTIVE");
    }

    return vendor;
}

async function preparePurchaseOrderItems(
    items: PurchaseOrderItemInput[],
    tenantId: string
): Promise<IPurchaseOrderItem[]> {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("PURCHASE_ORDER_ITEMS_REQUIRED");
    }

    const preparedItems: IPurchaseOrderItem[] = [];
    const usedInventoryIds = new Set<string>();

    for (const item of items) {
        if (
            !item ||
            typeof item.inventoryId !== "string"
        ) {
            throw new Error("INVALID_INVENTORY_ID");
        }

        validateObjectId(
            item.inventoryId,
            "INVALID_INVENTORY_ID"
        );

        validatePositiveNumber(
            item.quantity,
            "INVALID_ORDER_QUANTITY"
        );

        validateNonNegativeNumber(
            item.unitCost,
            "INVALID_UNIT_COST"
        );

        if (usedInventoryIds.has(item.inventoryId)) {
            throw new Error("DUPLICATE_INVENTORY_ITEM");
        }

        usedInventoryIds.add(item.inventoryId);

        const inventoryItem = await getInventoryByIdAndTenant(
            item.inventoryId,
            tenantId
        );

        if (!inventoryItem) {
            throw new Error("INVENTORY_ITEM_NOT_FOUND");
        }

        if (inventoryItem.status !== "active") {
            throw new Error("INVENTORY_ITEM_NOT_ACTIVE");
        }

        const total = roundMoney(
            item.quantity * item.unitCost
        );

        preparedItems.push({
            inventoryId: inventoryItem._id,
            itemCode: inventoryItem.itemCode,
            itemName: inventoryItem.name,
            quantity: item.quantity,
            receivedQuantity: 0,
            unitCost: item.unitCost,
            total,
        });
    }

    return preparedItems;
}

function calculateSubtotal(
    items: IPurchaseOrderItem[]
): number {
    return roundMoney(
        items.reduce((sum, item) => sum + item.total, 0)
    );
}

function validateDeliveryDates(
    orderDate: Date,
    expectedDeliveryDate?: Date
): void {
    if (
        expectedDeliveryDate &&
        expectedDeliveryDate < orderDate
    ) {
        throw new Error("INVALID_EXPECTED_DELIVERY_DATE");
    }
}

export async function createPurchaseOrderService(
    input: CreatePurchaseOrderInput
) {
    await validateActiveTenant(input.tenantId);

    const poNumber = input.poNumber?.trim().toUpperCase();

    if (!poNumber) {
        throw new Error("PO_NUMBER_REQUIRED");
    }

    const existingOrder = await getPurchaseOrderByNumberAndTenant(
        poNumber,
        input.tenantId
    );

    if (existingOrder) {
        throw new Error("PO_NUMBER_ALREADY_EXISTS");
    }

    await validateActiveVendor(
        input.vendorId,
        input.tenantId
    );

    const orderDate = input.orderDate
        ? parseDate(input.orderDate, "INVALID_ORDER_DATE")
        : new Date();

    const expectedDeliveryDate = input.expectedDeliveryDate
        ? parseDate(
            input.expectedDeliveryDate,
            "INVALID_EXPECTED_DELIVERY_DATE"
        )
        : undefined;

    validateDeliveryDates(orderDate, expectedDeliveryDate);

    const items = await preparePurchaseOrderItems(
        input.items,
        input.tenantId
    );

    const subtotal = calculateSubtotal(items);
    const taxAmount = input.taxAmount ?? 0;

    validateNonNegativeNumber(
        taxAmount,
        "INVALID_TAX_AMOUNT"
    );

    if (input.createdBy) {
        validateObjectId(input.createdBy, "INVALID_CREATED_BY");
    }

    const totalAmount = roundMoney(subtotal + taxAmount);

    const purchaseOrderData: Partial<IPurchaseOrder> = {
        tenantId: new mongoose.Types.ObjectId(input.tenantId),
        poNumber,
        vendorId: new mongoose.Types.ObjectId(input.vendorId),
        orderDate,
        items,
        subtotal,
        taxAmount,
        totalAmount,
        status: "draft",
        notes: input.notes?.trim(),
    };

    if (expectedDeliveryDate) {
        purchaseOrderData.expectedDeliveryDate =
            expectedDeliveryDate;
    }

    if (input.createdBy) {
        purchaseOrderData.createdBy =
            new mongoose.Types.ObjectId(input.createdBy);
    }

    return createPurchaseOrder(purchaseOrderData);
}

export async function getPurchaseOrdersByTenantService(
    tenantId: string
) {
    await validateActiveTenant(tenantId);

    return getPurchaseOrdersByTenant(tenantId);
}

export async function getPurchaseOrderByIdService(
    purchaseOrderId: string,
    tenantId: string
) {
    validateObjectId(
        purchaseOrderId,
        "INVALID_PURCHASE_ORDER_ID"
    );

    await validateActiveTenant(tenantId);

    const purchaseOrder = await getPurchaseOrderByIdAndTenant(
        purchaseOrderId,
        tenantId
    );

    if (!purchaseOrder) {
        throw new Error("PURCHASE_ORDER_NOT_FOUND");
    }

    return purchaseOrder;
}

export async function updatePurchaseOrderService(
    purchaseOrderId: string,
    tenantId: string,
    input: UpdatePurchaseOrderInput
) {
    validateObjectId(
        purchaseOrderId,
        "INVALID_PURCHASE_ORDER_ID"
    );

    await validateActiveTenant(tenantId);

    const existingOrder = await getPurchaseOrderByIdAndTenant(
        purchaseOrderId,
        tenantId
    );

    if (!existingOrder) {
        throw new Error("PURCHASE_ORDER_NOT_FOUND");
    }

    if (existingOrder.status !== "draft") {
        throw new Error("ONLY_DRAFT_PURCHASE_ORDERS_CAN_BE_UPDATED");
    }

    const updateData: Partial<IPurchaseOrder> = {};

    if (input.vendorId !== undefined) {
        await validateActiveVendor(input.vendorId, tenantId);

        updateData.vendorId = new mongoose.Types.ObjectId(
            input.vendorId
        );
    }

    if (input.orderDate !== undefined) {
        updateData.orderDate = parseDate(
            input.orderDate,
            "INVALID_ORDER_DATE"
        );
    }

    if (input.expectedDeliveryDate !== undefined) {
        updateData.expectedDeliveryDate = parseDate(
            input.expectedDeliveryDate,
            "INVALID_EXPECTED_DELIVERY_DATE"
        );
    }

    const finalOrderDate =
        updateData.orderDate ?? existingOrder.orderDate;

    const finalDeliveryDate =
        updateData.expectedDeliveryDate ??
        existingOrder.expectedDeliveryDate;

    validateDeliveryDates(
        finalOrderDate,
        finalDeliveryDate
    );

    if (input.items !== undefined) {
        const items = await preparePurchaseOrderItems(
            input.items,
            tenantId
        );

        updateData.items = items;
        updateData.subtotal = calculateSubtotal(items);
    }

    if (input.taxAmount !== undefined) {
        validateNonNegativeNumber(
            input.taxAmount,
            "INVALID_TAX_AMOUNT"
        );

        updateData.taxAmount = input.taxAmount;
    }

    const finalSubtotal =
        updateData.subtotal ?? existingOrder.subtotal;

    const finalTaxAmount =
        updateData.taxAmount ?? existingOrder.taxAmount;

    updateData.totalAmount = roundMoney(
        finalSubtotal + finalTaxAmount
    );

    if (input.notes !== undefined) {
        updateData.notes = input.notes.trim();
    }

    if (Object.keys(input).length === 0) {
        throw new Error("NO_PURCHASE_ORDER_FIELDS_TO_UPDATE");
    }

    const updatedOrder = await updatePurchaseOrderByIdAndTenant(
        purchaseOrderId,
        tenantId,
        updateData
    );

    if (!updatedOrder) {
        throw new Error("PURCHASE_ORDER_UPDATE_FAILED");
    }

    return updatedOrder;
}

export async function approvePurchaseOrderService(
    purchaseOrderId: string,
    tenantId: string,
    approvedBy: string
) {
    validateObjectId(
        purchaseOrderId,
        "INVALID_PURCHASE_ORDER_ID"
    );

    validateObjectId(
        approvedBy,
        "INVALID_APPROVED_BY"
    );

    await validateActiveTenant(tenantId);

    const existingOrder = await getPurchaseOrderByIdAndTenant(
        purchaseOrderId,
        tenantId
    );

    if (!existingOrder) {
        throw new Error("PURCHASE_ORDER_NOT_FOUND");
    }

    if (existingOrder.status !== "draft") {
        throw new Error("PURCHASE_ORDER_NOT_IN_DRAFT_STATUS");
    }

    const approvedOrder = await approvePurchaseOrderByIdAndTenant(
        purchaseOrderId,
        tenantId,
        approvedBy
    );

    if (!approvedOrder) {
        throw new Error("PURCHASE_ORDER_NOT_IN_DRAFT_STATUS");
    }

    return approvedOrder;
}

export async function deletePurchaseOrderService(
    purchaseOrderId: string,
    tenantId: string
) {
    validateObjectId(
        purchaseOrderId,
        "INVALID_PURCHASE_ORDER_ID"
    );

    await validateActiveTenant(tenantId);

    const existingOrder = await getPurchaseOrderByIdAndTenant(
        purchaseOrderId,
        tenantId
    );

    if (!existingOrder) {
        throw new Error("PURCHASE_ORDER_NOT_FOUND");
    }

    if (existingOrder.status !== "draft") {
        throw new Error("ONLY_DRAFT_PURCHASE_ORDERS_CAN_BE_DELETED");
    }

    const deletedOrder = await deletePurchaseOrderByIdAndTenant(
        purchaseOrderId,
        tenantId
    );

    if (!deletedOrder) {
        throw new Error("PURCHASE_ORDER_DELETE_FAILED");
    }

    return deletedOrder;
}

// Create a Goods Receipt and update Purchase Order and Inventory
// within one MongoDB transaction.
export async function createGoodsReceiptService(
    input: CreateGoodsReceiptInput
) {
    await validateActiveTenant(input.tenantId);

    validateObjectId(
        input.purchaseOrderId,
        "INVALID_PURCHASE_ORDER_ID"
    );

    if (input.receivedBy) {
        validateObjectId(
            input.receivedBy,
            "INVALID_RECEIVED_BY"
        );
    }

    const receiptNumber = input.receiptNumber
        ?.trim()
        .toUpperCase();

    if (!receiptNumber) {
        throw new Error("RECEIPT_NUMBER_REQUIRED");
    }

    if (
        !Array.isArray(input.items) ||
        input.items.length === 0
    ) {
        throw new Error("GOODS_RECEIPT_ITEMS_REQUIRED");
    }

    if (
        input.notes !== undefined &&
        typeof input.notes !== "string"
    ) {
        throw new Error("INVALID_RECEIPT_NOTES");
    }

    const receiptDate = input.receiptDate
        ? parseDate(
            input.receiptDate,
            "INVALID_RECEIPT_DATE"
        )
        : new Date();

    const usedInventoryIds = new Set<string>();

    for (const item of input.items) {
        if (
            !item ||
            typeof item.inventoryId !== "string"
        ) {
            throw new Error("INVALID_INVENTORY_ID");
        }

        validateObjectId(
            item.inventoryId,
            "INVALID_INVENTORY_ID"
        );

        validatePositiveNumber(
            item.receivedQuantity,
            "INVALID_RECEIVED_QUANTITY"
        );

        if (usedInventoryIds.has(item.inventoryId)) {
            throw new Error("DUPLICATE_INVENTORY_ITEM");
        }

        usedInventoryIds.add(item.inventoryId);
    }

    const session = await mongoose.startSession();

    try {
        const createdReceipt = await session.withTransaction(
            async () => {
                const purchaseOrder =
                    await getPurchaseOrderByIdAndTenantWithSession(
                        input.purchaseOrderId,
                        input.tenantId,
                        session
                    );

                if (!purchaseOrder) {
                    throw new Error("PURCHASE_ORDER_NOT_FOUND");
                }

                if (
                    purchaseOrder.status !== "approved" &&
                    purchaseOrder.status !== "partially_received"
                ) {
                    throw new Error(
                        "PURCHASE_ORDER_NOT_AVAILABLE_FOR_RECEIPT"
                    );
                }

                const receiptItems: IGoodsReceiptItem[] = [];

                for (const inputItem of input.items) {
                    const purchaseOrderItem =
                        purchaseOrder.items.find(
                            (item: IPurchaseOrderItem) =>
                                item.inventoryId.toString() ===
                                inputItem.inventoryId
                        );

                    if (!purchaseOrderItem) {
                        throw new Error(
                            "INVENTORY_ITEM_NOT_IN_PURCHASE_ORDER"
                        );
                    }

                    const remainingQuantity =
                        purchaseOrderItem.quantity -
                        purchaseOrderItem.receivedQuantity;

                    if (
                        inputItem.receivedQuantity >
                        remainingQuantity
                    ) {
                        throw new Error(
                            "RECEIVED_QUANTITY_EXCEEDS_ORDERED_QUANTITY"
                        );
                    }

                    const inventoryUpdate =
                        await incrementInventoryQuantityByIdAndTenant(
                            inputItem.inventoryId,
                            input.tenantId,
                            inputItem.receivedQuantity,
                            session
                        );

                    if (!inventoryUpdate) {
                        throw new Error(
                            "INVENTORY_ITEM_NOT_FOUND_OR_INACTIVE"
                        );
                    }

                    purchaseOrderItem.receivedQuantity +=
                        inputItem.receivedQuantity;

                    receiptItems.push({
                        inventoryId: purchaseOrderItem.inventoryId,
                        itemCode: purchaseOrderItem.itemCode,
                        itemName: purchaseOrderItem.itemName,
                        orderedQuantity: purchaseOrderItem.quantity,
                        receivedQuantity: inputItem.receivedQuantity,
                        unitCost: purchaseOrderItem.unitCost,
                        total: roundMoney(
                            inputItem.receivedQuantity *
                            purchaseOrderItem.unitCost
                        ),
                    });
                }

                const allItemsReceived =
                    purchaseOrder.items.every(
                        (item: IPurchaseOrderItem) =>
                            item.receivedQuantity >= item.quantity
                    );

                purchaseOrder.status = allItemsReceived
                    ? "received"
                    : "partially_received";

                await savePurchaseOrderWithSession(
                    purchaseOrder,
                    session
                );

                const receiptData: Partial<IGoodsReceipt> = {
                    tenantId: new mongoose.Types.ObjectId(
                        input.tenantId
                    ),
                    receiptNumber,
                    purchaseOrderId: purchaseOrder._id,
                    vendorId: purchaseOrder.vendorId,
                    receiptDate,
                    items: receiptItems,
                    status: "received",
                    notes: input.notes?.trim(),
                };

                if (input.receivedBy) {
                    receiptData.receivedBy =
                        new mongoose.Types.ObjectId(
                            input.receivedBy
                        );
                }

                return createGoodsReceiptWithSession(
                    receiptData,
                    session
                );
            }
        );

        if (!createdReceipt) {
            throw new Error("GOODS_RECEIPT_CREATION_FAILED");
        }

        return createdReceipt;
    } finally {
        await session.endSession();
    }
}
