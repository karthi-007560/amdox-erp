import { getAWSConfig } from "../../config/aws.js";

export function getAWSServiceConfig() {
    return getAWSConfig();
}

export function getS3ObjectUrl(objectKey: string): string {
    const config = getAWSConfig();

    if (!config?.bucket) {
        throw new Error(
            "AWS S3 is not configured. Set AWS_REGION and AWS_S3_BUCKET."
        );
    }

    const normalizedKey = objectKey
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");

    if (!normalizedKey || !normalizedKey.trim()) {
        throw new Error("A valid S3 object key is required.");
    }

    return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${normalizedKey}`;
}