import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
    const secret = process.env.ENCRYPTION_KEY;

    if (!secret || !/^[a-fA-F0-9]{64}$/.test(secret)) {
        throw new Error(
            "ENCRYPTION_KEY must be configured as a 64-character hexadecimal key."
        );
    }

    return Buffer.from(secret, "hex");
}

export function encryptData(plainText: string): string {
    if (typeof plainText !== "string") {
        throw new Error("Data to encrypt must be a string.");
    }

    const key = getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);

    const cipher = createCipheriv(
        ALGORITHM,
        key,
        iv
    );

    const encrypted = Buffer.concat([
        cipher.update(plainText, "utf8"),
        cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
        "v1",
        iv.toString("base64url"),
        authTag.toString("base64url"),
        encrypted.toString("base64url"),
    ].join(".");
}

export function decryptData(encryptedText: string): string {
    const parts = encryptedText.split(".");

    if (parts.length !== 4 || parts[0] !== "v1") {
        throw new Error("Invalid encrypted data format.");
    }

    const [, encodedIv, encodedTag, encodedData] = parts;

    const iv = Buffer.from(encodedIv, "base64url");
    const authTag = Buffer.from(encodedTag, "base64url");
    const encrypted = Buffer.from(encodedData, "base64url");

    if (
        iv.length !== IV_LENGTH ||
        authTag.length !== 16
    ) {
        throw new Error("Invalid encrypted data.");
    }

    const key = getEncryptionKey();

    const decipher = createDecipheriv(
        ALGORITHM,
        key,
        iv
    );

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);

    return decrypted.toString("utf8");
}