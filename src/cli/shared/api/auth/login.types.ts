export interface DeviceVerification {
    verificationUrl: string
    userCode: string
    expiresInMs: number
}

import type { ConnectionName } from '@/credentials'

export interface LoginOptions {
    /** The credential profile to log in with; may be omitted when only one profile exists. */
    profile?: string
    /** Which connection the tokens are for; `default` unless a separate Projects login is wanted. */
    connection?: ConnectionName
    /** Called once the device code is issued, so the command can show the user what to approve. */
    onVerificationRequired?: (verification: DeviceVerification) => void
}

export interface LoginResult {
    projectPath: string
    /** The profile the tokens were issued for. */
    profile: string
    connection: ConnectionName
    accessTokenExpiresAt: number
    /** Set when Zoho answered with a different data center than `api.baseUrl` in settings.json. */
    apiDomainMismatch: { expected: string; received: string } | null
}
