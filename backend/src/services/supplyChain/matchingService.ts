
import { Types } from "mongoose";

import { findInvoiceById } from "../../repositories/finance/invoiceRepository.js";

import {
    getPurchaseOrderByIdAndTenant,
    getGoodsReceiptByIdAndTenant,
} from "../../repositories/supplyChain/poRepository.js";

import { findTenantById } from "../../repositories/tenantRepository.js";

const validateObjectId = (id: string, fieldName: string) => {
    if (!Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ${fieldName}`);
    }
};

const validateActiveTenant = async (tenantId: string) => {
    validateObjectId(tenantId, "tenant ID");

    const tenant = await findTenantById(tenantId);

    if (!tenant || tenant.status !== "active") {
        throw new Error("Tenant not found or inactive");
    }
};

const getReferenceId = (value: unknown): string | undefined => {
    if (value instanceof Types.ObjectId) {
        return value.toString().toLowerCase();
    }

    if (typeof value === "string") {
        return value.toLowerCase();
    }

    if (
        value !== null &&
        typeof value === "object" &&
        "_id" in value
    ) {
        const id = (value as { _id: Types.ObjectId | string })._id;
        return id.toString().toLowerCase();
    }

    return undefined;
};

const toNumber = (
    value: Types.Decimal128 | string | number | undefined
): number => {
    if (value === undefined) {
        return 0;
    }

    const result = Number(value.toString());

    if (!Number.isFinite(result)) {
        throw new Error("Invalid numeric value found during matching");
    }

    return result;
};

const isDifferent = (
    first: number,
    second: number,
    tolerance = 0.000001
): boolean => {
    return Math.abs(first - second) > tolerance;
};

interface MatchItem {
    inventoryId: Types.ObjectId | string;
    quantity?: Types.Decimal128 | string | number;
    receivedQuantity?: Types.Decimal128 | string | number;
    unitCost?: Types.Decimal128 | string | number;
    total?: Types.Decimal128 | string | number;
}

interface InvoiceMatchItem {
    inventoryId?: Types.ObjectId;
    description: string;
    quantity: Types.Decimal128;
    unitPrice: Types.Decimal128;
    amount: Types.Decimal128;
}

export const matchPurchaseOrderInvoiceService = async (
    purchaseOrderId: string,
    invoiceId: string,
    tenantId: string
) => {
    await validateActiveTenant(tenantId);

    validateObjectId(purchaseOrderId, "purchase order ID");
    validateObjectId(invoiceId, "invoice ID");


    const purchaseOrder = await getPurchaseOrderByIdAndTenant(
        purchaseOrderId,
        tenantId
    );

    if (!purchaseOrder) {
        throw new Error("Purchase Order not found");
    }

    if (
        purchaseOrder.status === "draft" ||
        purchaseOrder.status === "cancelled"
    ) {
        throw new Error(
            "Cannot perform matching against a draft or cancelled Purchase Order"
        );
    }


    const invoice = await findInvoiceById(invoiceId, tenantId);

    if (!invoice || invoice.invoiceType !== "payable") {
        throw new Error("Payable invoice not found");
    }

    if (invoice.status === "cancelled") {
        throw new Error("Cannot match a cancelled invoice");
    }


    if (
        getReferenceId(invoice.purchaseOrderId) !==
        purchaseOrderId.toLowerCase()
    ) {
        throw new Error(
            "Invoice does not reference the specified Purchase Order"
        );
    }

    if (!invoice.vendorId || !invoice.goodsReceiptId) {
        throw new Error(
            "Invoice must contain vendor and Goods Receipt references"
        );
    }

    const purchaseOrderVendorId = getReferenceId(
        purchaseOrder.vendorId
    );

    const invoiceVendorId = getReferenceId(invoice.vendorId);

    if (purchaseOrderVendorId !== invoiceVendorId) {
        throw new Error(
            "Invoice vendor does not match Purchase Order vendor"
        );
    }

    const goodsReceipt = await getGoodsReceiptByIdAndTenant(
        invoice.goodsReceiptId.toString(),
        tenantId
    );

    if (!goodsReceipt || goodsReceipt.status !== "received") {
        throw new Error("Received Goods Receipt not found");
    }

    if (
        getReferenceId(goodsReceipt.purchaseOrderId) !==
        purchaseOrderId.toLowerCase()
    ) {
        throw new Error(
            "Goods Receipt does not belong to the specified Purchase Order"
        );
    }

    if (
        getReferenceId(goodsReceipt.vendorId) !== invoiceVendorId
    ) {
        throw new Error(
            "Goods Receipt vendor does not match invoice vendor"
        );
    }


    const poItems = purchaseOrder.items as unknown as MatchItem[];
    const grItems = goodsReceipt.items as unknown as MatchItem[];
    const invoiceItems = invoice.items as InvoiceMatchItem[];

    const discrepancies: {
        inventoryId: string;
        description: string;
        field: string;
        expected: number | string;
        actual: number | string;
        message: string;
    }[] = [];

    const matchedItems: {
        inventoryId: string;
        description: string;
        invoiceQuantity: number;
        receivedQuantity: number;
        orderedQuantity: number;
        purchaseOrderUnitPrice: number;
        goodsReceiptUnitPrice: number;
        invoiceUnitPrice: number;
        invoiceAmount: number;
    }[] = [];

    let invoiceSubtotal = 0;


    for (const item of invoiceItems) {
        if (!item.inventoryId) {
            discrepancies.push({
                inventoryId: "",
                description: item.description,
                field: "inventoryId",
                expected: "Valid inventory reference",
                actual: "Missing inventory reference",
                message: "Invoice item has no inventory reference",
            });

            continue;
        }

        const inventoryId = item.inventoryId.toString();

        const poItem = poItems.find(
            (entry) =>
                getReferenceId(entry.inventoryId) ===
                inventoryId.toLowerCase()
        );

        const grItem = grItems.find(
            (entry) =>
                getReferenceId(entry.inventoryId) ===
                inventoryId.toLowerCase()
        );

        if (!poItem) {
            discrepancies.push({
                inventoryId,
                description: item.description,
                field: "purchaseOrderItem",
                expected: "Item present in Purchase Order",
                actual: "Item not found",
                message: "Invoice item does not belong to the Purchase Order",
            });

            continue;
        }

        if (!grItem) {
            discrepancies.push({
                inventoryId,
                description: item.description,
                field: "goodsReceiptItem",
                expected: "Item present in Goods Receipt",
                actual: "Item not found",
                message: "Invoice item does not belong to the Goods Receipt",
            });

            continue;
        }

        const orderedQuantity = toNumber(poItem.quantity);
        const receivedQuantity = toNumber(grItem.receivedQuantity);

        const invoiceQuantity = toNumber(item.quantity);

        const poUnitPrice = toNumber(poItem.unitCost);
        const grUnitPrice = toNumber(grItem.unitCost);

        const invoiceUnitPrice = toNumber(item.unitPrice);
        const invoiceAmount = toNumber(item.amount);

        invoiceSubtotal += invoiceAmount;


        if (invoiceQuantity > orderedQuantity + 0.000001) {
            discrepancies.push({
                inventoryId,
                description: item.description,
                field: "quantity",
                expected: orderedQuantity,
                actual: invoiceQuantity,
                message: "Invoice quantity exceeds Purchase Order quantity",
            });
        }

        if (invoiceQuantity > receivedQuantity + 0.000001) {
            discrepancies.push({
                inventoryId,
                description: item.description,
                field: "receivedQuantity",
                expected: receivedQuantity,
                actual: invoiceQuantity,
                message: "Invoice quantity exceeds received quantity",
            });
        }

        if (isDifferent(invoiceUnitPrice, poUnitPrice)) {
            discrepancies.push({
                inventoryId,
                description: item.description,
                field: "purchaseOrderUnitPrice",
                expected: poUnitPrice,
                actual: invoiceUnitPrice,
                message: "Invoice unit price does not match Purchase Order",
            });
        }

        if (isDifferent(invoiceUnitPrice, grUnitPrice)) {
            discrepancies.push({
                inventoryId,
                description: item.description,
                field: "goodsReceiptUnitPrice",
                expected: grUnitPrice,
                actual: invoiceUnitPrice,
                message: "Invoice unit price does not match Goods Receipt",
            });
        }


        const calculatedAmount = invoiceQuantity * invoiceUnitPrice;

        if (isDifferent(invoiceAmount, calculatedAmount)) {
            discrepancies.push({
                inventoryId,
                description: item.description,
                field: "amount",
                expected: calculatedAmount,
                actual: invoiceAmount,
                message: "Invoice line amount is incorrect",
            });
        }

        matchedItems.push({
            inventoryId,
            description: item.description,
            invoiceQuantity,
            receivedQuantity,
            orderedQuantity,
            purchaseOrderUnitPrice: poUnitPrice,
            goodsReceiptUnitPrice: grUnitPrice,
            invoiceUnitPrice,
            invoiceAmount,
        });
    }

    const invoiceDeclaredSubtotal = toNumber(invoice.subtotal);

    if (isDifferent(invoiceSubtotal, invoiceDeclaredSubtotal)) {
        discrepancies.push({
            inventoryId: "",
            description: "Invoice subtotal",
            field: "subtotal",
            expected: invoiceSubtotal,
            actual: invoiceDeclaredSubtotal,
            message: "Invoice subtotal does not match its item amounts",
        });
    }

    const isMatched = discrepancies.length === 0;

    return {
        purchaseOrderId: purchaseOrder._id.toString(),
        purchaseOrderNumber: purchaseOrder.poNumber,

        invoiceId: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        invoiceStatus: invoice.status,

        goodsReceiptId: goodsReceipt._id.toString(),
        goodsReceiptNumber: goodsReceipt.receiptNumber,

        vendorId: invoiceVendorId,

        matchingStatus: isMatched ? "matched" : "discrepancy",

        summary: {
            totalInvoiceItems: invoiceItems.length,
            successfullyComparedItems: matchedItems.length,
            totalDiscrepancies: discrepancies.length,
            invoiceSubtotal: invoiceDeclaredSubtotal,
        },

        matchedItems,
        discrepancies,
    };
};
