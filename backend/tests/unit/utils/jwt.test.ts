import jwt from "jsonwebtoken";

import {
    generateToken,
    verifyToken,
    decodeToken,
} from "../../../src/utils/jwt";

const TEST_SECRET = "amdox-test-secret-for-jwt-unit-testing";

describe("JWT Utilities", () => {
    const originalJwtSecret = process.env.JWT_SECRET;
    const originalJwtExpiresIn = process.env.JWT_EXPIRES_IN;

    beforeEach(() => {
        process.env.JWT_SECRET = TEST_SECRET;
        delete process.env.JWT_EXPIRES_IN;
    });

    afterAll(() => {
        if (originalJwtSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalJwtSecret;
        }

        if (originalJwtExpiresIn === undefined) {
            delete process.env.JWT_EXPIRES_IN;
        } else {
            process.env.JWT_EXPIRES_IN = originalJwtExpiresIn;
        }
    });

    describe("generateToken", () => {
        it.each(["admin", "manager", "employee"] as const)(
            "should generate a valid token for the %s role",
            (role) => {
                const token = generateToken("user-123", role);

                expect(token).toEqual(expect.any(String));

                const decoded = jwt.decode(token) as jwt.JwtPayload;

                expect(decoded.sub).toBe("user-123");
                expect(decoded.role).toBe(role);
            }
        );

        it("should generate a token with the default expiration", () => {
            const token = generateToken("user-123", "admin");
            const decoded = jwt.decode(token) as jwt.JwtPayload;

            expect(decoded.exp).toBeDefined();
            expect(decoded.iat).toBeDefined();
            expect(decoded.exp! - decoded.iat!).toBe(15 * 60);
        });

        it("should use JWT_EXPIRES_IN when configured", () => {
            process.env.JWT_EXPIRES_IN = "30m";

            const token = generateToken("user-123", "admin");
            const decoded = jwt.decode(token) as jwt.JwtPayload;

            expect(decoded.exp! - decoded.iat!).toBe(30 * 60);
        });

        it("should support a custom expiration value", () => {
            const token = generateToken("user-123", "admin", "2h");
            const decoded = jwt.decode(token) as jwt.JwtPayload;

            expect(decoded.exp! - decoded.iat!).toBe(2 * 60 * 60);
        });

        it("should reject an empty user ID", () => {
            expect(() => generateToken("", "admin"))
                .toThrow("User ID is required to generate a token.");
        });

        it("should reject a whitespace-only user ID", () => {
            expect(() => generateToken("   ", "admin"))
                .toThrow("User ID is required to generate a token.");
        });

        it("should reject token generation when JWT_SECRET is missing", () => {
            delete process.env.JWT_SECRET;

            expect(() => generateToken("user-123", "admin"))
                .toThrow("JWT_SECRET is not configured.");
        });
    });

    describe("verifyToken", () => {
        it("should verify a valid token and return its payload", () => {
            const token = generateToken("user-123", "admin");

            expect(verifyToken(token)).toEqual({
                sub: "user-123",
                role: "admin",
            });
        });

        it.each(["admin", "manager", "employee"] as const)(
            "should verify tokens with the %s role",
            (role) => {
                const token = generateToken("user-123", role);

                expect(verifyToken(token).role).toBe(role);
            }
        );

        it("should reject a token signed with a different secret", () => {
            const token = jwt.sign(
                { role: "admin" },
                "a-different-secret",
                { subject: "user-123" }
            );

            expect(() => verifyToken(token)).toThrow();
        });

        it("should reject a malformed token", () => {
            expect(() => verifyToken("invalid-token")).toThrow();
        });

        it("should reject an expired token", () => {
            const token = jwt.sign(
                { role: "admin" },
                TEST_SECRET,
                {
                    subject: "user-123",
                    expiresIn: -1,
                }
            );

            expect(() => verifyToken(token)).toThrow();
        });

        it("should reject a token with an invalid role", () => {
            const token = jwt.sign(
                { role: "superadmin" },
                TEST_SECRET,
                { subject: "user-123" }
            );

            expect(() => verifyToken(token))
                .toThrow("Invalid authentication token payload.");
        });

        it("should reject a token without a subject", () => {
            const token = jwt.sign(
                { role: "admin" },
                TEST_SECRET
            );

            expect(() => verifyToken(token))
                .toThrow("Invalid authentication token payload.");
        });

        it("should reject a string payload", () => {
            const token = jwt.sign("invalid-payload", TEST_SECRET);

            expect(() => verifyToken(token))
                .toThrow("Invalid authentication token payload.");
        });

        it("should reject verification when JWT_SECRET is missing", () => {
            const token = generateToken("user-123", "admin");

            delete process.env.JWT_SECRET;

            expect(() => verifyToken(token))
                .toThrow("JWT_SECRET is not configured.");
        });
    });

    describe("decodeToken", () => {
        it("should decode a valid token without verifying its signature", () => {
            const token = generateToken("user-123", "manager");

            expect(decodeToken(token)).toEqual({
                sub: "user-123",
                role: "manager",
            });
        });

        it("should decode a token even when signed with a different secret", () => {
            const token = jwt.sign(
                { role: "employee" },
                "another-secret",
                { subject: "user-456" }
            );

            expect(decodeToken(token)).toEqual({
                sub: "user-456",
                role: "employee",
            });
        });

        it("should return null for a malformed token", () => {
            expect(decodeToken("invalid-token")).toBeNull();
        });

        it("should return null for an invalid role", () => {
            const token = jwt.sign(
                { role: "superadmin" },
                TEST_SECRET,
                { subject: "user-123" }
            );

            expect(decodeToken(token)).toBeNull();
        });

        it("should return null when the subject is missing", () => {
            const token = jwt.sign(
                { role: "admin" },
                TEST_SECRET
            );

            expect(decodeToken(token)).toBeNull();
        });

        it("should return null for a string payload", () => {
            const token = jwt.sign("invalid-payload", TEST_SECRET);

            expect(decodeToken(token)).toBeNull();
        });

        it("should return null for an empty token", () => {
            expect(decodeToken("")).toBeNull();
        });
    });
});
