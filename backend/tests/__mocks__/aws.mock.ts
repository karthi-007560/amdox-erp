export const mockAWSConfig = {
    region: "ap-south-1",
    bucket: "amdox-test-bucket",
};

export const getAWSConfig = jest.fn().mockReturnValue(mockAWSConfig);

export const mockS3ObjectUrl = jest.fn(
    (objectKey: string): string =>
        `https://${mockAWSConfig.bucket}.s3.${mockAWSConfig.region}.amazonaws.com/${objectKey}`
);

export const resetAWSMocks = (): void => {
    getAWSConfig.mockReset().mockReturnValue(mockAWSConfig);
    mockS3ObjectUrl.mockClear();
};
