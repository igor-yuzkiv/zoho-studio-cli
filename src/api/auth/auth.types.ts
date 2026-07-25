export interface DeviceCodeRequest {
    baseUrl: string
    clientId: string
    scopes: string[]
}

export interface DeviceCode {
    deviceCode: string
    userCode: string
    verificationUrl: string
    /** Milliseconds to wait between polling requests. */
    pollIntervalMs: number
    expiresInMs: number
}

export interface DeviceTokenRequest {
    baseUrl: string
    clientId: string
    clientSecret: string
    deviceCode: string
}

export interface TokenResponse {
    accessToken: string
    refreshToken: string
    accessTokenExpiresAt: number
    apiDomain: string
    tokenType: string
}

/** Zoho answers "not yet" as often as it answers with tokens, so waiting is not an error. */
export type DeviceTokenPollResult =
    | { status: 'pending' }
    | { status: 'slow_down' }
    | { status: 'authorized'; tokens: TokenResponse }
