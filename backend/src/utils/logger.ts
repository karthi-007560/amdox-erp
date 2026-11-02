type LogMetadata = Record<string, unknown>;

function writeLog(
    level: "info" | "warn" | "error",
    message: string,
    metadata?: LogMetadata
): void {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...(metadata ? { metadata } : {}),
    };

    if (level === "error") {
        console.error(entry);
        return;
    }

    if (level === "warn") {
        console.warn(entry);
        return;
    }

    console.log(entry);
}

export const logger = {
    info(message: string, metadata?: LogMetadata): void {
        writeLog("info", message, metadata);
    },

    warn(message: string, metadata?: LogMetadata): void {
        writeLog("warn", message, metadata);
    },

    error(message: string, metadata?: LogMetadata): void {
        writeLog("error", message, metadata);
    },
};