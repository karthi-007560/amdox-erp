export const mockTokenResponse = {
    access_token: "mock-access-token",
    expires_in: 300,
    refresh_expires_in: 1800,
    refresh_token: "mock-refresh-token",
    token_type: "Bearer",
    scope: "openid profile email"
};

export const mockUserInfo = {
    sub: "mock-keycloak-user-id",
    email: "test@example.com",
    email_verified: true,
    preferred_username: "testuser",
    name: "Test User",
    given_name: "Test",
    family_name: "User"
};

export const getKeycloakAccessToken = jest.fn()
    .mockResolvedValue(mockTokenResponse);

export const loginWithKeycloak = jest.fn()
    .mockResolvedValue(mockTokenResponse);

export const refreshKeycloakToken = jest.fn()
    .mockResolvedValue(mockTokenResponse);

export const getKeycloakUserInfo = jest.fn()
    .mockResolvedValue(mockUserInfo);

export const revokeKeycloakToken = jest.fn()
    .mockResolvedValue(undefined);

export const resetKeycloakMocks = (): void => {
    getKeycloakAccessToken.mockReset().mockResolvedValue(mockTokenResponse);
    loginWithKeycloak.mockReset().mockResolvedValue(mockTokenResponse);
    refreshKeycloakToken.mockReset().mockResolvedValue(mockTokenResponse);
    getKeycloakUserInfo.mockReset().mockResolvedValue(mockUserInfo);
    revokeKeycloakToken.mockReset().mockResolvedValue(undefined);
};
