import { AppError } from "../../../src/utils/errors";

describe("AppError", () => {
    it("should create an error with the supplied message", () => {
        const error = new AppError("Something went wrong");

        expect(error.message).toBe("Something went wrong");
    });

    it("should use the default status code of 500", () => {
        const error = new AppError("Internal error");

        expect(error.statusCode).toBe(500);
    });

    it("should use the default error code", () => {
        const error = new AppError("Internal error");

        expect(error.errorCode).toBe("INTERNAL_SERVER_ERROR");
    });

    it("should mark the error as operational", () => {
        const error = new AppError("Operational error");

        expect(error.isOperational).toBe(true);
    });

    it("should set the error name to AppError", () => {
        const error = new AppError("Test error");

        expect(error.name).toBe("AppError");
    });

    it("should support custom status codes", () => {
        const error = new AppError("Not found", 404);

        expect(error.statusCode).toBe(404);
    });

    it("should support custom error codes", () => {
        const error = new AppError(
            "User not found",
            404,
            "USER_NOT_FOUND"
        );

        expect(error.errorCode).toBe("USER_NOT_FOUND");
    });

    it("should preserve all custom properties together", () => {
        const error = new AppError(
            "Access denied",
            403,
            "FORBIDDEN"
        );

        expect(error).toMatchObject({
            name: "AppError",
            message: "Access denied",
            statusCode: 403,
            errorCode: "FORBIDDEN",
            isOperational: true,
        });
    });

    it("should be an instance of Error", () => {
        const error = new AppError("Test error");

        expect(error).toBeInstanceOf(Error);
    });

    it("should be an instance of AppError", () => {
        const error = new AppError("Test error");

        expect(error).toBeInstanceOf(AppError);
    });

    it("should provide a stack trace", () => {
        const error = new AppError("Stack trace test");

        expect(error.stack).toEqual(expect.any(String));
    });
});
