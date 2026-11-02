export const AUTH_EVENTS = {
    REGISTERED: "auth.registered",
    LOGGED_IN: "auth.logged_in",
    LOGGED_OUT: "auth.logged_out",
    LOGIN_FAILED: "auth.login_failed",
    PASSWORD_CHANGED: "auth.password_changed",
} as const;

export interface AuthEventPayload {
    userId?: string;
    tenantId?: string;
    email?: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface AuthEventMap {
    [AUTH_EVENTS.REGISTERED]: AuthEventPayload;
    [AUTH_EVENTS.LOGGED_IN]: AuthEventPayload;
    [AUTH_EVENTS.LOGGED_OUT]: AuthEventPayload;
    [AUTH_EVENTS.LOGIN_FAILED]: AuthEventPayload;
    [AUTH_EVENTS.PASSWORD_CHANGED]: AuthEventPayload;
}