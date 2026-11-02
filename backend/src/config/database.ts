import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logging";

export async function connectDB(): Promise<void> {
    await mongoose.connect(env.MONGO_URI);

    logger.info("MongoDB Atlas connected successfully");
}