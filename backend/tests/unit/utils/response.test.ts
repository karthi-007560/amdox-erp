import type { Response } from "express";

import {
    successResponse,
    errorResponse,
} from "../../../src/utils/response";

describe("Response Utilities", () => {
    let res: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn().mockReturnThis();
        statusMock = jest.fn().mockReturnValue({
            json: jsonMock,
        });

        res = {
            status: statusMock,
        };
    });

    describe("successResponse", () => {
        it("should return a successful response with data", () => {
            const data = { id: "123", name: "Test User" };

            successResponse(
                res as Response,
                200,
                "User fetched successfully.",
                data
            );

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                message: "User fetched successfully.",
                data,
            });
        });

        it("should return a successful response without data", () => {
            successResponse(
                res as Response,
                201,
                "User created successfully."
            );

            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                message: "User created successfully.",
            });
        });

        it("should include data when data is null", () => {
            successResponse(
                res as Response,
                200,
                "Request completed.",
                null
            );

            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                message: "Request completed.",
                data: null,
            });
        });

        it("should preserve false as response data", () => {
            successResponse(
                res as Response,
                200,
                "Operation completed.",
                false
            );

            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                message: "Operation completed.",
                data: false,
            });
        });

        it("should preserve zero as response data", () => {
            successResponse(
                res as Response,
                200,
                "Count retrieved.",
                0
            );

            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                message: "Count retrieved.",
                data: 0,
            });
        });

        it("should preserve an empty string as response data", () => {
            successResponse(
                res as Response,
                200,
                "Value retrieved.",
                ""
            );

            expect(jsonMock).toHaveBeenCalledWith({
                success: true,
                message: "Value retrieved.",
                data: "",
            });
        });

        it("should return the Express response object", () => {
            const responseObject = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis(),
            };

            const result = successResponse(
                responseObject as unknown as Response,
                200,
                "Success."
            );

            expect(result).toBe(responseObject);
        });
    });

    describe("errorResponse", () => {
        it("should return an error response with an error code", () => {
            errorResponse(
                res as Response,
                400,
                "Invalid request.",
                "VALIDATION_ERROR"
            );

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: "Invalid request.",
                errorCode: "VALIDATION_ERROR",
            });
        });

        it("should return an error response without an error code", () => {
            errorResponse(
                res as Response,
                500,
                "Internal server error."
            );

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: "Internal server error.",
            });
        });

        it("should omit an empty error code", () => {
            errorResponse(
                res as Response,
                400,
                "Bad request.",
                ""
            );

            expect(jsonMock).toHaveBeenCalledWith({
                success: false,
                message: "Bad request.",
            });
        });

        it("should return the Express response object", () => {
            const responseObject = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis(),
            };

            const result = errorResponse(
                responseObject as unknown as Response,
                404,
                "Resource not found."
            );

            expect(result).toBe(responseObject);
        });
    });
});
