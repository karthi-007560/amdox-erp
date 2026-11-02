import { getKeycloakConfig } from "../../config/keycloak.js";

export interface KeycloakTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_expires_in?: number;
    refresh_token?: string;
    token_type: string;
    scope?: string;
    id_token?: string;
}

export interface KeycloakUserInfo {
    sub: string;
    email?: string;
    email_verified?: boolean;
    preferred_username?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    [key: string]: unknown;
}

function getConfig() {
    const config = getKeycloakConfig();

    if (!config) {
        throw new Error("Keycloak is not configured.");
    }

    return config;
}

function getTokenEndpoint(): string {
    const config = getConfig();

    return `${config.issuer}/protocol/openid-connect/token`;
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error = await response.text();

        throw new Error(
            `Keycloak request failed (${response.status}): ${error}`
        );
    }

    return response.json() as Promise<T>;
}

export async function getKeycloakAccessToken():
Promise<KeycloakTokenResponse> {
    const config = getConfig();

    if (!config.clientSecret) {
        throw new Error("KEYCLOAK_CLIENT_SECRET is required.");
    }

    const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: config.clientId,
        client_secret: config.clientSecret,
    });

    const response = await fetch(getTokenEndpoint(), {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
    });

    return handleResponse<KeycloakTokenResponse>(response);
}

export async function loginWithKeycloak(
    username: string,
    password: string
): Promise<KeycloakTokenResponse> {
    const config = getConfig();

    if (!username.trim() || !password) {
        throw new Error("Username and password are required.");
    }

    const body = new URLSearchParams({
        grant_type: "password",
        client_id: config.clientId,
        username,
        password,
    });

    if (config.clientSecret) {
        body.set("client_secret", config.clientSecret);
    }

    const response = await fetch(getTokenEndpoint(), {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
    });

    return handleResponse<KeycloakTokenResponse>(response);
}

export async function refreshKeycloakToken(
    refreshToken: string
): Promise<KeycloakTokenResponse> {
    const config = getConfig();

    if (!refreshToken.trim()) {
        throw new Error("Refresh token is required.");
    }

    const body = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: config.clientId,
        refresh_token: refreshToken,
    });

    if (config.clientSecret) {
        body.set("client_secret", config.clientSecret);
    }

    const response = await fetch(getTokenEndpoint(), {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
    });

    return handleResponse<KeycloakTokenResponse>(response);
}

export async function getKeycloakUserInfo(
    accessToken: string
): Promise<KeycloakUserInfo> {
    const config = getConfig();

    if (!accessToken.trim()) {
        throw new Error("Access token is required.");
    }

    const response = await fetch(
        `${config.issuer}/protocol/openid-connect/userinfo`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    return handleResponse<KeycloakUserInfo>(response);
}

export async function revokeKeycloakToken(
    token: string,
    tokenTypeHint: "access_token" | "refresh_token" = "refresh_token"
): Promise<void> {
    const config = getConfig();

    if (!token.trim()) {
        throw new Error("Token is required.");
    }

    const body = new URLSearchParams({
        client_id: config.clientId,
        token,
        token_type_hint: tokenTypeHint,
    });

    if (config.clientSecret) {
        body.set("client_secret", config.clientSecret);
    }

    const response = await fetch(
        `${config.issuer}/protocol/openid-connect/revoke`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
        }
    );

    if (!response.ok) {
        throw new Error(
            `Keycloak token revocation failed (${response.status}).`
        );
    }
}