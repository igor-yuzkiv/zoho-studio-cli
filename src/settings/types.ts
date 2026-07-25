/** Holds the client secret and the refresh token, so `.zoho-studio/settings.json` is kept out of git. */
export interface ProjectSettings {
    auth: {
        baseUrl: string
        scopes: string[]
        clientId: string
        clientSecret: string
        /** Issued by the OAuth flow and rewritten by the CLI rather than edited by hand. */
        tokens: {
            accessToken: string
            refreshToken: string
            accessTokenExpiresAt: number
        }
    }
    api: {
        baseUrl: string
        version: string
    }
}
