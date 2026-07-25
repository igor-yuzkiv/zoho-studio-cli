export interface ProjectConfig {
    auth: {
        baseUrl: string,
        clientId: string,
        clientSecret: string,
        scopes: string[],
        accessToken: string,
        refreshToken: string,
        accessTokenExpiresAt: number
    }
    api: {
        baseUrl: string,
        version: string,
    }
}
