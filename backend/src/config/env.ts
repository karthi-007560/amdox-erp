import "dotenv/config";

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;

if (!mongoUri) {
    throw new Error("MONGO_URI or MONGODB_URI is required");
}

if (!jwtSecret) {
    throw new Error("JWT_SECRET is required");
}

const port = Number(process.env.PORT || 5001);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid port number");
}

export const env = {
    PORT: port,
    NODE_ENV: process.env.NODE_ENV || "development",
    MONGO_URI: mongoUri,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
    CORS_ORIGINS: (process.env.CORS_ORIGIN || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
};