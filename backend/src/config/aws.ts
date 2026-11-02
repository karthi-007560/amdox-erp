import "dotenv/config";

export interface AWSConfig {
    region: string;
    bucket?: string;
}

export function getAWSConfig(): AWSConfig | null {
    const region =
        process.env.AWS_REGION ||
        process.env.AWS_DEFAULT_REGION;

    const bucket = process.env.AWS_S3_BUCKET;

    if (!region && !bucket) {
        return null;
    }

    if (!region) {
        throw new Error("AWS_REGION is required when AWS is configured.");
    }

    return {
        region,
        ...(bucket ? { bucket } : {}),
    };
}