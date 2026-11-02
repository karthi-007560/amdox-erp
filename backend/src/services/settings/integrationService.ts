
import { Types } from "mongoose";
import { Tenant, ITenantIntegration } from "../../models/Tenant";

const supportedProviders = [
    "google",
    "slack",
    "microsoft",
    "stripe",
    "twilio",
    "sendgrid",
];

const validateActiveTenant = async (tenantId: string) => {
    if (!Types.ObjectId.isValid(tenantId)) {
        throw new Error("Invalid tenant ID");
    }

    const tenant = await Tenant.findOne({
        _id: tenantId,
        status: "active",
    });

    if (!tenant) {
        throw new Error("Active tenant not found");
    }

    return tenant;
};

const validateProvider = (provider: string) => {
    const normalizedProvider = provider?.trim().toLowerCase();

    if (
        !normalizedProvider ||
        !supportedProviders.includes(normalizedProvider)
    ) {
        throw new Error("Unsupported integration provider");
    }

    return normalizedProvider;
};

const validateIntegrationSettings = (
    settings: Record<string, unknown>
): Record<string, string> => {
    const sensitiveKeys = [
        "password",
        "secret",
        "apikey",
        "accesstoken",
        "refreshtoken",
        "clientsecret",
        "authorization",
        "privatekey",
        "credential",
    ];

    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(settings)) {
        const normalizedKey = key.toLowerCase().replace(/[_-]/g, "");

        if (
            sensitiveKeys.some((sensitiveKey) =>
                normalizedKey.includes(sensitiveKey)
            )
        ) {
            throw new Error(
                `Sensitive credential ${key} cannot be stored in tenant settings`
            );
        }

        if (
            typeof value !== "string" &&
            typeof value !== "number" &&
            typeof value !== "boolean"
        ) {
            throw new Error(`Invalid integration setting: ${key}`);
        }

        result[key] = String(value);
    }

    return result;
};

const formatIntegration = (integration: ITenantIntegration) => ({
    provider: integration.provider,
    enabled: integration.enabled,
    settings: Object.fromEntries(integration.settings || new Map<string, string>()),
    configuredAt: integration.configuredAt,
});

export const createIntegration = async (
    tenantId: string,
    input: {
        provider: string;
        settings?: Record<string, unknown>;
        enabled?: boolean;
    }
) => {
    const tenant = await validateActiveTenant(tenantId);
    const provider = validateProvider(input.provider);

    const integrations: ITenantIntegration[] =
        tenant.settings?.integrations || [];

    if (integrations.some((item: ITenantIntegration) => item.provider === provider)) {
        throw new Error("Integration already exists");
    }

    const settings = validateIntegrationSettings(input.settings || {});

    const integration: ITenantIntegration = {
        provider,
        enabled: input.enabled ?? false,
        settings: new Map<string, string>(Object.entries(settings)),
        configuredAt: new Date(),
    };

    integrations.push(integration);

    tenant.set("settings.integrations", integrations);

    await tenant.save();

    return formatIntegration(integration);
};

export const listIntegrations = async (tenantId: string) => {
    const tenant = await validateActiveTenant(tenantId);

    const integrations: ITenantIntegration[] =
        tenant.settings?.integrations || [];

    return integrations.map((integration: ITenantIntegration) =>
        formatIntegration(integration)
    );
};

export const getIntegrationByProvider = async (
    tenantId: string,
    providerInput: string
) => {
    const tenant = await validateActiveTenant(tenantId);
    const provider = validateProvider(providerInput);

    const integrations: ITenantIntegration[] =
        tenant.settings?.integrations || [];

    const integration = integrations.find(
        (item: ITenantIntegration) => item.provider === provider
    );

    if (!integration) {
        throw new Error("Integration not found");
    }

    return formatIntegration(integration);
};

export const updateIntegration = async (
    tenantId: string,
    providerInput: string,
    input: {
        enabled?: boolean;
        settings?: Record<string, unknown>;
    }
) => {
    const tenant = await validateActiveTenant(tenantId);
    const provider = validateProvider(providerInput);

    const integrations: ITenantIntegration[] =
        tenant.settings?.integrations || [];

    const integration = integrations.find(
        (item: ITenantIntegration) => item.provider === provider
    );

    if (!integration) {
        throw new Error("Integration not found");
    }

    if (input.enabled !== undefined) {
        if (typeof input.enabled !== "boolean") {
            throw new Error("Enabled must be a boolean");
        }

        integration.enabled = input.enabled;
    }

    if (input.settings !== undefined) {
        const settings = validateIntegrationSettings(input.settings);

        const existingSettings = integration.settings || new Map<string, string>();

        integration.settings = new Map<string, string>([
            ...existingSettings.entries(),
            ...Object.entries(settings),
        ]);
    }

    integration.configuredAt = new Date();

    tenant.set("settings.integrations", integrations);

    await tenant.save();

    return formatIntegration(integration);
};

export const deleteIntegration = async (
    tenantId: string,
    providerInput: string
) => {
    const tenant = await validateActiveTenant(tenantId);
    const provider = validateProvider(providerInput);

    const integrations: ITenantIntegration[] =
        tenant.settings?.integrations || [];

    const integrationIndex = integrations.findIndex(
        (item: ITenantIntegration) => item.provider === provider
    );

    if (integrationIndex === -1) {
        throw new Error("Integration not found");
    }

    integrations.splice(integrationIndex, 1);

    tenant.set("settings.integrations", integrations);

    await tenant.save();

    return {
        message: "Integration removed successfully",
    };
};
