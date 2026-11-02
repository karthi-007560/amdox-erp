import {
    mkdir,
    readFile,
    unlink,
    writeFile,
} from "fs/promises";

import path from "path";

const STORAGE_DIRECTORY = path.resolve(
    process.cwd(),
    process.env.FILE_STORAGE_DIR || "storage"
);

function resolveFilePath(fileName: string): string {
    if (
        !fileName.trim() ||
        fileName === "." ||
        fileName === ".." ||
        fileName.includes("/") ||
        fileName.includes("\\") ||
        fileName.includes("\0")
    ) {
        throw new Error("Invalid file name.");
    }

    return path.join(STORAGE_DIRECTORY, fileName);
}

export async function saveFile(
    fileName: string,
    fileBuffer: Buffer
): Promise<string> {
    if (!Buffer.isBuffer(fileBuffer)) {
        throw new Error("A valid file buffer is required.");
    }

    const filePath = resolveFilePath(fileName);

    await mkdir(STORAGE_DIRECTORY, {
        recursive: true,
    });

    await writeFile(filePath, fileBuffer, {
        flag: "wx",
    });

    return filePath;
}

export async function readStoredFile(
    fileName: string
): Promise<Buffer> {
    const filePath = resolveFilePath(fileName);

    return readFile(filePath);
}

export async function deleteStoredFile(
    fileName: string
): Promise<void> {
    const filePath = resolveFilePath(fileName);

    await unlink(filePath);
}

export function getStoredFilePath(
    fileName: string
): string {
    return resolveFilePath(fileName);
}