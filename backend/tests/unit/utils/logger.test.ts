import { logger } from "../../../src/utils/logger";

describe("Logger Utility", () => {
    let logSpy: jest.SpyInstance;
    let warnSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
        logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        logSpy.mockRestore();
        warnSpy.mockRestore();
        errorSpy.mockRestore();
    });

    describe("info", () => {
        it("should write an info log to console.log", () => {
            logger.info("User logged in.");

            expect(logSpy).toHaveBeenCalledTimes(1);

            const entry = logSpy.mock.calls[0][0];

            expect(entry).toMatchObject({
                level: "info",
                message: "User logged in.",
            });

            expect(entry.timestamp).toEqual(expect.any(String));
            expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp);
        });

        it("should include metadata when provided", () => {
            const metadata = { userId: "123", role: "admin" };

            logger.info("User logged in.", metadata);

            expect(logSpy.mock.calls[0][0]).toMatchObject({
                level: "info",
                message: "User logged in.",
                metadata,
            });
        });

        it("should not include metadata when omitted", () => {
            logger.info("Application started.");

            expect(logSpy.mock.calls[0][0]).not.toHaveProperty("metadata");
        });
    });

    describe("warn", () => {
        it("should write a warning log to console.warn", () => {
            logger.warn("Disk space is running low.");

            expect(warnSpy).toHaveBeenCalledTimes(1);

            expect(warnSpy.mock.calls[0][0]).toMatchObject({
                level: "warn",
                message: "Disk space is running low.",
            });

            expect(warnSpy.mock.calls[0][0].timestamp)
                .toEqual(expect.any(String));
        });

        it("should include metadata when provided", () => {
            const metadata = { availableSpace: 100, unit: "MB" };

            logger.warn("Low disk space.", metadata);

            expect(warnSpy.mock.calls[0][0].metadata).toEqual(metadata);
        });

        it("should not include metadata when omitted", () => {
            logger.warn("Warning message.");

            expect(warnSpy.mock.calls[0][0]).not.toHaveProperty("metadata");
        });
    });

    describe("error", () => {
        it("should write an error log to console.error", () => {
            logger.error("Database connection failed.");

            expect(errorSpy).toHaveBeenCalledTimes(1);

            expect(errorSpy.mock.calls[0][0]).toMatchObject({
                level: "error",
                message: "Database connection failed.",
            });

            expect(errorSpy.mock.calls[0][0].timestamp)
                .toEqual(expect.any(String));
        });

        it("should include metadata when provided", () => {
            const metadata = {
                errorCode: "DB_CONNECTION_ERROR",
                retryCount: 3,
            };

            logger.error("Database connection failed.", metadata);

            expect(errorSpy.mock.calls[0][0].metadata).toEqual(metadata);
        });

        it("should not include metadata when omitted", () => {
            logger.error("Unexpected error.");

            expect(errorSpy.mock.calls[0][0]).not.toHaveProperty("metadata");
        });
    });

    it("should use only the matching console method for each log level", () => {
        logger.info("Info message.");
        logger.warn("Warning message.");
        logger.error("Error message.");

        expect(logSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledTimes(1);
    });
});
