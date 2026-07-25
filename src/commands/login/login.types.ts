export interface DeviceVerification {
    verificationUrl: string
    userCode: string
    expiresInMs: number
}

export interface LoginOptions {
    /** Called once the device code is issued, so the command can show the user what to approve. */
    onVerificationRequired?: (verification: DeviceVerification) => void
}

export interface LoginResult {
    projectPath: string
    accessTokenExpiresAt: number
    /** Set when Zoho answered with a different data center than `api.baseUrl` in settings.json. */
    apiDomainMismatch: { expected: string; received: string } | null
}
