import { encryptData, decryptData } from "../../../src/utils/encryption";

const VALID_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("Encryption Utilities", () => {
    const originalEncryptionKey = process.env.ENCRYPTION_KEY;

    beforeEach(() => {
        process.env.ENCRYPTION_KEY = VALID_KEY;
    });

    afterAll(() => {
        if (originalEncryptionKey === undefined) {
            delete process.env.ENCRYPTION_KEY;
        } else {
            process.env.ENCRYPTION_KEY = originalEncryptionKey;
        }
    });

    describe("encryptData", () => {
        it("should encrypt a plain text string", () => {
            const encrypted = encryptData("Hello Amdox ERP");

            expect(encrypted).toEqual(expect.any(String));
            expect(encrypted).not.toBe("Hello Amdox ERP");
        });

        it("should generate the expected encrypted data format", () => {
            const encrypted = encryptData("Test data");
            const parts = encrypted.split(".");

            expect(parts).toHaveLength(4);
            expect(parts[0]).toBe("v1");
            expect(parts[1]).toBeTruthy();
            expect(parts[2]).toBeTruthy();
        });

        it("should produce different encrypted values for the same input", () => {
            const first = encryptData("Same input");
            const second = encryptData("Same input");

            expect(first).not.toBe(second);
        });

        it("should encrypt an empty string", () => {
            const encrypted = encryptData("");

            expect(decryptData(encrypted)).toBe("");
        });

        it("should support Unicode and special characters", () => {
            const original = "Amdox ERP – नमस्ते – 🔐";

            const encrypted = encryptData(original);

            expect(decryptData(encrypted)).toBe(original);
        });

        it("should reject non-string input", () => {
            expect(() => encryptData(123 as unknown as string))
                .toThrow("Data to encrypt must be a string.");
        });

        it("should reject encryption when the key is missing", () => {
            delete process.env.ENCRYPTION_KEY;

            expect(() => encryptData("Sensitive data"))
                .toThrow(
                    "ENCRYPTION_KEY must be configured as a 64-character hexadecimal key."
                );
        });

        it("should reject an encryption key with an invalid length", () => {
            process.env.ENCRYPTION_KEY = "123456";

            expect(() => encryptData("Sensitive data"))
                .toThrow(
                    "ENCRYPTION_KEY must be configured as a 64-character hexadecimal key."
                );
        });

        it("should reject a non-hexadecimal encryption key", () => {
            process.env.ENCRYPTION_KEY = "z".repeat(64);

            expect(() => encryptData("Sensitive data"))
                .toThrow(
                    "ENCRYPTION_KEY must be configured as a 64-character hexadecimal key."
                );
        });
    });

    describe("decryptData", () => {
        it("should decrypt previously encrypted data", () => {
            const original = "Amdox ERP confidential information";
            const encrypted = encryptData(original);

            expect(decryptData(encrypted)).toBe(original);
        });

        it("should reject an invalid encrypted data format", () => {
            expect(() => decryptData("invalid-data"))
                .toThrow("Invalid encrypted data format.");
        });

        it("should reject an unsupported encryption version", () => {
            expect(() => decryptData("v2.abc.def.ghi"))
                .toThrow("Invalid encrypted data format.");
        });

        it("should reject encrypted data with missing components", () => {
            expect(() => decryptData("v1.abc.def"))
                .toThrow("Invalid encrypted data format.");
        });

        it("should reject an invalid IV length", () => {
            const invalidData = [
                "v1",
                Buffer.from("short").toString("base64url"),
                Buffer.alloc(16).toString("base64url"),
                Buffer.from("data").toString("base64url"),
            ].join(".");

            expect(() => decryptData(invalidData))
                .toThrow("Invalid encrypted data.");
        });

        it("should reject an invalid authentication tag length", () => {
            const invalidData = [
                "v1",
                Buffer.alloc(12).toString("base64url"),
                Buffer.from("short").toString("base64url"),
                Buffer.from("data").toString("base64url"),
            ].join(".");

            expect(() => decryptData(invalidData))
                .toThrow("Invalid encrypted data.");
        });

        it("should reject data encrypted with a different key", () => {
            const encrypted = encryptData("Sensitive data");

            process.env.ENCRYPTION_KEY = "abcdef0123456789".repeat(4);

            expect(() => decryptData(encrypted)).toThrow();
        });

        it("should reject tampered encrypted data", () => {
            const encrypted = encryptData("Sensitive data");
            const parts = encrypted.split(".");

            parts[3] = Buffer.from("Tampered data").toString("base64url");

            expect(() => decryptData(parts.join("."))).toThrow();
        });

        it("should reject data when the encryption key is missing", () => {
            const encrypted = encryptData("Sensitive data");

            delete process.env.ENCRYPTION_KEY;

            expect(() => decryptData(encrypted))
                .toThrow(
                    "ENCRYPTION_KEY must be configured as a 64-character hexadecimal key."
                );
        });
    });
});
