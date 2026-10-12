/** A Zoho API Console client, reusable by any number of projects. */
export interface CredentialProfile {
    name: string
    clientId: string
    clientSecret: string
}

/** The tokens one login produced, tied to the profile whose client issued them. */
export interface ConnectionTokens {
    profile: string
    accessToken: string
    refreshToken: string
    accessTokenExpiresAt: number
}

export interface ProjectTokensFile {
    /** The original project root; the key encoding is lossy, so a read checks it against the caller. */
    projectPath: string
    /** Earlier versions kept several connections here; only `default` is read and written, so their files still work. */
    connections: { default?: ConnectionTokens }
}
