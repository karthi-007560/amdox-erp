import cors from "cors";
import { env } from "./env";

export const corsMiddleware = cors({
    origin: env.CORS_ORIGINS.length > 0
        ? env.CORS_ORIGINS
        : "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
});