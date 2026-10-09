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

/** `default` serves every command; `projects`, when logged in, takes over the Zoho Projects ones. */
export type ConnectionName = 'default' | 'projects'

export interface ProjectTokensFile {
    /** The original project root; the key encoding is lossy, so a read checks it against the caller. */
    projectPath: string
    connections: Partial<Record<ConnectionName, ConnectionTokens>>
}
