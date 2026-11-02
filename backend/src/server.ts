import express from "express";
import { env } from "./config/env";
import { corsMiddleware } from "./config/cors";
import { connectDB } from "./config/database";
import { logger } from "./config/logging";
import apiRoutes from "./routes";
import {
    notFoundHandler,
    errorHandler,
} from "./middleware/errorHandler.middleware";
import { requestLogger } from "./middleware/requestLogger.middleware";
import { apiRateLimiter } from "./middleware/rateLimiter.middleware";

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(requestLogger);

app.use("/api", apiRateLimiter, apiRoutes);

app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Amdox ERP backend is running",
    });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer(): Promise<void> {
    try {
        await connectDB();

        app.listen(env.PORT, () => {
            logger.info("Amdox ERP server started", {
                port: env.PORT,
                environment: env.NODE_ENV,
            });
        });
    } catch (error: unknown) {
        logger.error("Failed to start the server", {
            error: error instanceof Error ? error.message : String(error),
        });

        process.exit(1);
    }
}

void startServer();