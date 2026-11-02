
import type { Request, Response, NextFunction } from "express";

function isRequestBody(
    body: unknown
): body is Record<string, unknown> {
    return (
        body !== null &&
        typeof body === "object" &&
        !Array.isArray(body)
    );
}

function sendValidationError(
    res: Response,
    message: string
): void {
    res.status(400).json({
        success: false,
        message,
    });
}

const allowedVendorStatuses = ["active", "inactive"];

const allowedVendorFields = [
    "vendorCode",
    "name",
    "contactPerson",
    "email",
    "phone",
    "website",
    "address",
    "taxId",
    "paymentTermsDays",
    "status",
    "notes",
];

function validateVendorOptionalFields(
    body: Record<string, unknown>
): string | undefined {
    const stringFields = [
        "contactPerson",
        "email",
        "phone",
        "website",
        "address",
        "taxId",
        "notes",
    ];

    for (const field of stringFields) {
        if (
            body[field] !== undefined &&
            typeof body[field] !== "string"
        ) {
            return `${field.toUpperCase()}_MUST_BE_A_STRING`;
        }
    }

    if (
        body.email !== undefined &&
        typeof body.email === "string" &&
        body.email.trim() !== "" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
    ) {
        return "INVALID_VENDOR_EMAIL";
    }

    if (
        body.status !== undefined &&
        (
            typeof body.status !== "string" ||
            !allowedVendorStatuses.includes(body.status)
        )
    ) {
        return "INVALID_VENDOR_STATUS";
    }

    if (
        body.paymentTermsDays !== undefined &&
        (
            typeof body.paymentTermsDays !== "number" ||
            !Number.isInteger(body.paymentTermsDays) ||
            body.paymentTermsDays < 0 ||
            body.paymentTermsDays > 365
        )
    ) {
        return "INVALID_PAYMENT_TERMS";
    }

    return undefined;
}

export function validateCreateVendor(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const body = req.body;

    if (!isRequestBody(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    if (
        Object.keys(body).some(
            (field) => !allowedVendorFields.includes(field)
        )
    ) {
        sendValidationError(res, "INVALID_REQUEST_FIELDS");
        return;
    }

    if (
        typeof body.vendorCode !== "string" ||
        !body.vendorCode.trim()
    ) {
        sendValidationError(res, "VENDOR_CODE_REQUIRED");
        return;
    }

    if (
        typeof body.name !== "string" ||
        !body.name.trim()
    ) {
        sendValidationError(res, "VENDOR_NAME_REQUIRED");
        return;
    }

    const error = validateVendorOptionalFields(body);

    if (error) {
        sendValidationError(res, error);
        return;
    }

    next();
}

export function validateUpdateVendor(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const body = req.body;

    if (!isRequestBody(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    const fields = Object.keys(body);

    if (
        fields.length === 0 ||
        fields.some(
            (field) => !allowedVendorFields.includes(field)
        )
    ) {
        sendValidationError(res, "INVALID_OR_EMPTY_UPDATE_FIELDS");
        return;
    }

    if (
        body.vendorCode !== undefined &&
        (
            typeof body.vendorCode !== "string" ||
            !body.vendorCode.trim()
        )
    ) {
        sendValidationError(res, "VENDOR_CODE_REQUIRED");
        return;
    }

    if (
        body.name !== undefined &&
        (
            typeof body.name !== "string" ||
            !body.name.trim()
        )
    ) {
        sendValidationError(res, "VENDOR_NAME_REQUIRED");
        return;
    }

    const error = validateVendorOptionalFields(body);

    if (error) {
        sendValidationError(res, error);
        return;
    }

    next();
}

const allowedInventoryStatuses = ["active", "inactive"];

const allowedInventoryFields = [
    "itemCode",
    "name",
    "description",
    "category",
    "unit",
    "quantity",
    "reservedQuantity",
    "reorderLevel",
    "unitCost",
    "warehouse",
    "status",
];

function validateInventoryOptionalFields(
    body: Record<string, unknown>
): string | undefined {
    const stringFields = [
        "description",
        "category",
        "warehouse",
    ];

    for (const field of stringFields) {
        if (
            body[field] !== undefined &&
            typeof body[field] !== "string"
        ) {
            return `${field.toUpperCase()}_MUST_BE_A_STRING`;
        }
    }

    const numericFields = [
        "quantity",
        "reservedQuantity",
        "reorderLevel",
        "unitCost",
    ];

    for (const field of numericFields) {
        if (
            body[field] !== undefined &&
            (
                typeof body[field] !== "number" ||
                !Number.isFinite(body[field]) ||
                body[field] < 0
            )
        ) {
            return `INVALID_${field.replace(
                /[A-Z]/g,
                (letter) => `_${letter}`
            ).toUpperCase()}`;
        }
    }

    if (
        body.status !== undefined &&
        (
            typeof body.status !== "string" ||
            !allowedInventoryStatuses.includes(body.status)
        )
    ) {
        return "INVALID_INVENTORY_STATUS";
    }

    return undefined;
}

export function validateCreateInventory(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const body = req.body;

    if (!isRequestBody(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    if (
        Object.keys(body).some(
            (field) => !allowedInventoryFields.includes(field)
        )
    ) {
        sendValidationError(res, "INVALID_REQUEST_FIELDS");
        return;
    }

    if (
        typeof body.itemCode !== "string" ||
        !body.itemCode.trim()
    ) {
        sendValidationError(res, "ITEM_CODE_REQUIRED");
        return;
    }

    if (
        typeof body.name !== "string" ||
        !body.name.trim()
    ) {
        sendValidationError(res, "ITEM_NAME_REQUIRED");
        return;
    }

    if (
        typeof body.unit !== "string" ||
        !body.unit.trim()
    ) {
        sendValidationError(res, "UNIT_REQUIRED");
        return;
    }

    const error = validateInventoryOptionalFields(body);

    if (error) {
        sendValidationError(res, error);
        return;
    }

    const quantity =
        typeof body.quantity === "number" ? body.quantity : 0;

    const reservedQuantity =
        typeof body.reservedQuantity === "number"
            ? body.reservedQuantity
            : 0;

    if (reservedQuantity > quantity) {
        sendValidationError(
            res,
            "RESERVED_QUANTITY_EXCEEDS_STOCK"
        );
        return;
    }

    next();
}

export function validateUpdateInventory(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const body = req.body;

    if (!isRequestBody(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    const fields = Object.keys(body);

    if (
        fields.length === 0 ||
        fields.some(
            (field) => !allowedInventoryFields.includes(field)
        )
    ) {
        sendValidationError(
            res,
            "INVALID_OR_EMPTY_UPDATE_FIELDS"
        );
        return;
    }

    if (
        body.itemCode !== undefined &&
        (
            typeof body.itemCode !== "string" ||
            !body.itemCode.trim()
        )
    ) {
        sendValidationError(res, "ITEM_CODE_REQUIRED");
        return;
    }

    if (
        body.name !== undefined &&
        (
            typeof body.name !== "string" ||
            !body.name.trim()
        )
    ) {
        sendValidationError(res, "ITEM_NAME_REQUIRED");
        return;
    }

    if (
        body.unit !== undefined &&
        (
            typeof body.unit !== "string" ||
            !body.unit.trim()
        )
    ) {
        sendValidationError(res, "UNIT_REQUIRED");
        return;
    }

    const error = validateInventoryOptionalFields(body);

    if (error) {
        sendValidationError(res, error);
        return;
    }

    next();
}

// ==========================================
// PURCHASE ORDER VALIDATION
// ==========================================

const allowedPurchaseOrderFields = [
    "poNumber",
    "vendorId",
    "orderDate",
    "expectedDeliveryDate",
    "items",
    "taxAmount",
    "notes",
];

const allowedPurchaseOrderItemFields = [
    "inventoryId",
    "quantity",
    "unitCost",
];

function isValidObjectId(value: unknown): boolean {
    return (
        typeof value === "string" &&
        /^[a-fA-F0-9]{24}$/.test(value)
    );
}

function isValidDate(value: unknown): boolean {
    if (
        typeof value !== "string" &&
        !(value instanceof Date)
    ) {
        return false;
    }

    return !Number.isNaN(new Date(value).getTime());
}

function validatePurchaseOrderDates(
    body: Record<string, unknown>
): string | undefined {
    if (
        body.orderDate !== undefined &&
        !isValidDate(body.orderDate)
    ) {
        return "INVALID_ORDER_DATE";
    }

    if (
        body.expectedDeliveryDate !== undefined &&
        !isValidDate(body.expectedDeliveryDate)
    ) {
        return "INVALID_EXPECTED_DELIVERY_DATE";
    }

    if (
        body.orderDate !== undefined &&
        body.expectedDeliveryDate !== undefined &&
        isValidDate(body.orderDate) &&
        isValidDate(body.expectedDeliveryDate)
    ) {
        const orderDateTime =
            body.orderDate instanceof Date
                ? body.orderDate.getTime()
                : new Date(body.orderDate as string).getTime();

        const deliveryDateTime =
            body.expectedDeliveryDate instanceof Date
                ? body.expectedDeliveryDate.getTime()
                : new Date(
                    body.expectedDeliveryDate as string
                ).getTime();

        if (deliveryDateTime < orderDateTime) {
            return "INVALID_EXPECTED_DELIVERY_DATE";
        }
    }

    return undefined;
}

function validatePurchaseOrderItems(
    items: unknown
): string | undefined {
    if (!Array.isArray(items) || items.length === 0) {
        return "PURCHASE_ORDER_ITEMS_REQUIRED";
    }

    for (const item of items) {
        if (!isRequestBody(item)) {
            return "INVALID_PURCHASE_ORDER_ITEM";
        }

        if (
            Object.keys(item).some(
                (field) =>
                    !allowedPurchaseOrderItemFields.includes(field)
            )
        ) {
            return "INVALID_PURCHASE_ORDER_ITEM_FIELDS";
        }

        if (!isValidObjectId(item.inventoryId)) {
            return "INVALID_INVENTORY_ID";
        }

        if (
            typeof item.quantity !== "number" ||
            !Number.isFinite(item.quantity) ||
            item.quantity <= 0
        ) {
            return "INVALID_ORDER_QUANTITY";
        }

        if (
            typeof item.unitCost !== "number" ||
            !Number.isFinite(item.unitCost) ||
            item.unitCost < 0
        ) {
            return "INVALID_UNIT_COST";
        }
    }

    return undefined;
}

function validatePurchaseOrderOptionalFields(
    body: Record<string, unknown>
): string | undefined {
    if (
        body.taxAmount !== undefined &&
        (
            typeof body.taxAmount !== "number" ||
            !Number.isFinite(body.taxAmount) ||
            body.taxAmount < 0
        )
    ) {
        return "INVALID_TAX_AMOUNT";
    }

    if (
        body.notes !== undefined &&
        typeof body.notes !== "string"
    ) {
        return "NOTES_MUST_BE_A_STRING";
    }

    return validatePurchaseOrderDates(body);
}

export function validateCreatePurchaseOrder(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const body = req.body;

    if (!isRequestBody(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    if (
        Object.keys(body).some(
            (field) =>
                !allowedPurchaseOrderFields.includes(field)
        )
    ) {
        sendValidationError(res, "INVALID_REQUEST_FIELDS");
        return;
    }

    if (
        typeof body.poNumber !== "string" ||
        !body.poNumber.trim()
    ) {
        sendValidationError(res, "PO_NUMBER_REQUIRED");
        return;
    }

    if (!isValidObjectId(body.vendorId)) {
        sendValidationError(res, "INVALID_VENDOR_ID");
        return;
    }

    const itemsError = validatePurchaseOrderItems(body.items);

    if (itemsError) {
        sendValidationError(res, itemsError);
        return;
    }

    const optionalFieldsError =
        validatePurchaseOrderOptionalFields(body);

    if (optionalFieldsError) {
        sendValidationError(res, optionalFieldsError);
        return;
    }

    next();
}

export function validateUpdatePurchaseOrder(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const body = req.body;

    if (!isRequestBody(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    const fields = Object.keys(body);

    if (
        fields.length === 0 ||
        fields.some(
            (field) =>
                !allowedPurchaseOrderFields.includes(field)
        )
    ) {
        sendValidationError(
            res,
            "INVALID_OR_EMPTY_UPDATE_FIELDS"
        );
        return;
    }

    if (body.poNumber !== undefined) {
        sendValidationError(
            res,
            "PO_NUMBER_CANNOT_BE_UPDATED"
        );
        return;
    }

    if (
        body.vendorId !== undefined &&
        !isValidObjectId(body.vendorId)
    ) {
        sendValidationError(res, "INVALID_VENDOR_ID");
        return;
    }

    if (body.items !== undefined) {
        const itemsError = validatePurchaseOrderItems(body.items);

        if (itemsError) {
            sendValidationError(res, itemsError);
            return;
        }
    }

    const optionalFieldsError =
        validatePurchaseOrderOptionalFields(body);

    if (optionalFieldsError) {
        sendValidationError(res, optionalFieldsError);
        return;
    }

    next();
}


const allowedGoodsReceiptFields = [
    "receiptNumber",
    "items",
    "receiptDate",
    "notes",
];

const allowedGoodsReceiptItemFields = [
    "inventoryId",
    "receivedQuantity",
];

function validateGoodsReceiptItems(
    items: unknown
): string | undefined {
    if (!Array.isArray(items) || items.length === 0) {
        return "GOODS_RECEIPT_ITEMS_REQUIRED";
    }

    const usedInventoryIds = new Set<string>();

    for (const item of items) {
        if (!isRequestBody(item)) {
            return "INVALID_GOODS_RECEIPT_ITEM";
        }

        if (
            Object.keys(item).some(
                (field) =>
                    !allowedGoodsReceiptItemFields.includes(field)
            )
        ) {
            return "INVALID_GOODS_RECEIPT_ITEM_FIELDS";
        }

        if (!isValidObjectId(item.inventoryId)) {
            return "INVALID_INVENTORY_ID";
        }

        if (
            typeof item.receivedQuantity !== "number" ||
            !Number.isFinite(item.receivedQuantity) ||
            item.receivedQuantity <= 0
        ) {
            return "INVALID_RECEIVED_QUANTITY";
        }

        const inventoryId = (
            item.inventoryId as string
        ).toLowerCase();

        if (usedInventoryIds.has(inventoryId)) {
            return "DUPLICATE_INVENTORY_ITEM";
        }

        usedInventoryIds.add(inventoryId);
    }

    return undefined;
}

export function validateCreateGoodsReceipt(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const body = req.body;

    if (!isRequestBody(body)) {
        sendValidationError(res, "INVALID_REQUEST_BODY");
        return;
    }

    if (
        Object.keys(body).some(
            (field) =>
                !allowedGoodsReceiptFields.includes(field)
        )
    ) {
        sendValidationError(res, "INVALID_REQUEST_FIELDS");
        return;
    }

    if (
        typeof body.receiptNumber !== "string" ||
        !body.receiptNumber.trim()
    ) {
        sendValidationError(res, "RECEIPT_NUMBER_REQUIRED");
        return;
    }

    const itemsError = validateGoodsReceiptItems(body.items);

    if (itemsError) {
        sendValidationError(res, itemsError);
        return;
    }

    if (
        body.receiptDate !== undefined &&
        !isValidDate(body.receiptDate)
    ) {
        sendValidationError(res, "INVALID_RECEIPT_DATE");
        return;
    }

    if (
        body.notes !== undefined &&
        typeof body.notes !== "string"
    ) {
        sendValidationError(res, "INVALID_RECEIPT_NOTES");
        return;
    }

    next();
}
