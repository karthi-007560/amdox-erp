import "dotenv/config";

export interface KeycloakConfig {
    baseUrl: string;
    realm: string;
    clientId: string;
    clientSecret?: string;
    issuer: string;
}

export function getKeycloakConfig(): KeycloakConfig | null {
    const baseUrl = (
        process.env.KEYCLOAK_URL ||
        process.env.KEYCLOAK_BASE_URL ||
        ""
    ).replace(/\/+$/, "");

    const realm = process.env.KEYCLOAK_REALM;
    const clientId = process.env.KEYCLOAK_CLIENT_ID;
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

    const isConfigured = Boolean(
        baseUrl || realm || clientId || clientSecret
    );

    if (!isConfigured) {
        return null;
    }

    if (!baseUrl || !realm || !clientId) {
        throw new Error(
            "KEYCLOAK_URL, KEYCLOAK_REALM and KEYCLOAK_CLIENT_ID are required."
        );
    }

    try {
        const url = new URL(baseUrl);

        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {
            throw new Error();
        }
    } catch {
        throw new Error("Invalid KEYCLOAK_URL configuration.");
    }

    return {
        baseUrl,
        realm,
        clientId,
        ...(clientSecret ? { clientSecret } : {}),
        issuer: `${baseUrl}/realms/${encodeURIComponent(realm)}`,
    };
}