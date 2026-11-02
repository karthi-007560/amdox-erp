export const mockConnectDB = jest.fn().mockResolvedValue(undefined);

export const mockDisconnectDB = jest.fn().mockResolvedValue(undefined);

export const mockClearDatabase = jest.fn().mockResolvedValue(undefined);

export const resetDatabaseMocks = (): void => {
    mockConnectDB.mockReset().mockResolvedValue(undefined);
    mockDisconnectDB.mockReset().mockResolvedValue(undefined);
    mockClearDatabase.mockReset().mockResolvedValue(undefined);
};
