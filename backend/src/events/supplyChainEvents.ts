export const SUPPLY_CHAIN_EVENTS = {
    VENDOR_CREATED: "supply_chain.vendor_created",
    PURCHASE_ORDER_CREATED: "supply_chain.purchase_order_created",
    PURCHASE_ORDER_APPROVED: "supply_chain.purchase_order_approved",
    GOODS_RECEIVED: "supply_chain.goods_received",
    INVENTORY_UPDATED: "supply_chain.inventory_updated",
    FORECAST_GENERATED: "supply_chain.forecast_generated",
} as const;

export interface SupplyChainEventPayload {
    tenantId: string;
    actorId?: string;
    vendorId?: string;
    purchaseOrderId?: string;
    goodsReceiptId?: string;
    inventoryId?: string;
    forecastId?: string;
    status?: string;
    metadata?: Record<string, unknown>;
}

export interface SupplyChainEventMap {
    [SUPPLY_CHAIN_EVENTS.VENDOR_CREATED]: SupplyChainEventPayload;
    [SUPPLY_CHAIN_EVENTS.PURCHASE_ORDER_CREATED]: SupplyChainEventPayload;
    [SUPPLY_CHAIN_EVENTS.PURCHASE_ORDER_APPROVED]: SupplyChainEventPayload;
    [SUPPLY_CHAIN_EVENTS.GOODS_RECEIVED]: SupplyChainEventPayload;
    [SUPPLY_CHAIN_EVENTS.INVENTORY_UPDATED]: SupplyChainEventPayload;
    [SUPPLY_CHAIN_EVENTS.FORECAST_GENERATED]: SupplyChainEventPayload;
}