import "dotenv/config";

export interface RedisConfig {
    url?: string;
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database: number;
    tls: boolean;
}

export function getRedisConfig(): RedisConfig | null {
    const redisUrl = process.env.REDIS_URL;

    const host = process.env.REDIS_HOST;
    const portValue = process.env.REDIS_PORT;

    const username = process.env.REDIS_USERNAME;
    const password = process.env.REDIS_PASSWORD;

    const databaseValue = process.env.REDIS_DB || "0";

    const tlsEnabled =
        process.env.REDIS_TLS?.toLowerCase() === "true";

    const database = Number(databaseValue);

    if (
        !Number.isInteger(database) ||
        database < 0
    ) {
        throw new Error("REDIS_DB must be a non-negative integer.");
    }

    if (redisUrl) {
        let parsedUrl: URL;

        try {
            parsedUrl = new URL(redisUrl);
        } catch {
            throw new Error("Invalid REDIS_URL configuration.");
        }

        if (
            parsedUrl.protocol !== "redis:" &&
            parsedUrl.protocol !== "rediss:"
        ) {
            throw new Error(
                "REDIS_URL must use redis:// or rediss://."
            );
        }

        return {
            url: redisUrl,
            database,
            tls: parsedUrl.protocol === "rediss:" || tlsEnabled,
        };
    }

    if (!host && !portValue && !username && !password && !tlsEnabled) {
        return null;
    }

    if (!host) {
        throw new Error("REDIS_HOST is required for Redis configuration.");
    }

    const port = portValue ? Number(portValue) : 6379;

    if (
        !Number.isInteger(port) ||
        port < 1 ||
        port > 65535
    ) {
        throw new Error("Invalid REDIS_PORT configuration.");
    }

    return {
        host,
        port,
        ...(username ? { username } : {}),
        ...(password ? { password } : {}),
        database,
        tls: tlsEnabled,
    };
}