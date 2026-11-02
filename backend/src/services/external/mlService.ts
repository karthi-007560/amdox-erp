interface MLServiceConfig {
    baseUrl: string;
    apiKey?: string;
    timeout: number;
}

export interface MLServiceRequest {
    endpoint: string;
    payload: Record<string, unknown>;
    method?: "GET" | "POST" | "PUT" | "PATCH";
}

function getMLServiceConfig(): MLServiceConfig {
    const baseUrl = process.env.ML_API_URL?.replace(/\/+$/, "");

    if (!baseUrl) {
        throw new Error("ML_API_URL is not configured.");
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
        throw new Error("Invalid ML_API_URL configuration.");
    }

    const timeout = Number(
        process.env.ML_API_TIMEOUT || 30000
    );

    if (!Number.isInteger(timeout) || timeout <= 0) {
        throw new Error("ML_API_TIMEOUT must be a positive integer.");
    }

    return {
        baseUrl,
        ...(process.env.ML_API_KEY
            ? { apiKey: process.env.ML_API_KEY }
            : {}),
        timeout,
    };
}

export async function callMLService<TResponse = unknown>(
    request: MLServiceRequest
): Promise<TResponse> {
    const config = getMLServiceConfig();

    const endpoint = request.endpoint.replace(/^\/+/, "");

    if (!endpoint) {
        throw new Error("ML API endpoint is required.");
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(
        () => controller.abort(),
        config.timeout
    );

    try {
        const url = new URL(
            endpoint,
            `${config.baseUrl}/`
        );

        const method = request.method || "POST";

        if (method === "GET") {
            for (const [key, value] of Object.entries(request.payload)) {
                url.searchParams.set(key, String(value));
            }
        }

        const response = await fetch(url, {
            method,
            headers: {
                Accept: "application/json",
                ...(method !== "GET"
                    ? { "Content-Type": "application/json" }
                    : {}),
                ...(config.apiKey
                    ? { Authorization: `Bearer ${config.apiKey}` }
                    : {}),
            },
            ...(method !== "GET"
                ? { body: JSON.stringify(request.payload) }
                : {}),
            signal: controller.signal,
        });

        if (!response.ok) {
            const error = await response.text();

            throw new Error(
                `ML service request failed (${response.status}): ${error}`
            );
        }

        return await response.json() as TResponse;
    } catch (error) {
        if (
            error instanceof Error &&
            error.name === "AbortError"
        ) {
            throw new Error("ML service request timed out.");
        }

        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function getForecast<TResponse = unknown>(
    payload: Record<string, unknown>
): Promise<TResponse> {
    return callMLService<TResponse>({
        endpoint: "forecast",
        payload,
        method: "POST",
    });
}

export async function getPrediction<TResponse = unknown>(
    payload: Record<string, unknown>
): Promise<TResponse> {
    return callMLService<TResponse>({
        endpoint: "predict",
        payload,
        method: "POST",
    });
}

export async function checkMLServiceHealth(): Promise<boolean> {
    const config = getMLServiceConfig();

    const response = await fetch(
        `${config.baseUrl}/health`,
        {
            method: "GET",
            signal: AbortSignal.timeout(config.timeout),
        }
    );

    return response.ok;
}