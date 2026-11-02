import { EventEmitter } from "node:events";

import type { AuditEventMap } from "./auditEvents.js";
import type { AuthEventMap } from "./authEvents.js";
import type { FinanceEventMap } from "./financeEvents.js";
import type { HREventMap } from "./hrEvents.js";
import type { NotificationEventMap } from "./notificationEvents.js";
import type { SupplyChainEventMap } from "./supplyChainEvents.js";

type AppEventMap = AuditEventMap &
    AuthEventMap &
    FinanceEventMap &
    HREventMap &
    NotificationEventMap &
    SupplyChainEventMap;

type AppEventName = keyof AppEventMap;

type AppEventListener<K extends AppEventName> = (
    payload: AppEventMap[K]
) => void;

const emitter = new EventEmitter();

export const emitAppEvent = <K extends AppEventName>(
    eventName: K,
    payload: AppEventMap[K]
): boolean => {
    return emitter.emit(eventName, payload);
};

export const onAppEvent = <K extends AppEventName>(
    eventName: K,
    listener: AppEventListener<K>
): (() => void) => {
    const wrappedListener = listener as (...args: unknown[]) => void;

    emitter.on(eventName, wrappedListener);

    return () => {
        emitter.off(eventName, wrappedListener);
    };
};

export const onceAppEvent = <K extends AppEventName>(
    eventName: K,
    listener: AppEventListener<K>
): (() => void) => {
    const wrappedListener = listener as (...args: unknown[]) => void;

    emitter.once(eventName, wrappedListener);

    return () => {
        emitter.off(eventName, wrappedListener);
    };
};