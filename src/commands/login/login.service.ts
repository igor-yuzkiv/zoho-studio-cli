import { pollDeviceToken, requestDeviceCode, type DeviceCode, type TokenResponse } from '@/api/auth'
import { projectSettingsGitignoreEntry } from '@/config'
import { getProjectSettings, saveProjectSettings } from '@/settings'

import type { LoginOptions, LoginResult } from './login.types'

export async function login({ onVerificationRequired }: LoginOptions = {}): Promise<LoginResult> {
    const { projectPath, settings } = await getProjectSettings()
    const { clientId, clientSecret, scopes } = settings.auth

    if (!clientId || !clientSecret) {
        throw new Error(
            `auth.clientId and auth.clientSecret are required in ${projectSettingsGitignoreEntry}. ` +
                'Copy them from your client in the Zoho API Console — see docs/4-login-command.md.'
        )
    }

    if (scopes.length === 0) {
        throw new Error(`auth.scopes is empty in ${projectSettingsGitignoreEntry}. List the scopes the CLI may use.`)
    }

    const deviceCode = await requestDeviceCode({ clientId, scopes })

    onVerificationRequired?.({
        verificationUrl: deviceCode.verificationUrl,
        userCode: deviceCode.userCode,
        expiresInMs: deviceCode.expiresInMs,
    })

    const tokens = await waitForApproval({ clientId, clientSecret }, deviceCode)

    await saveProjectSettings(projectPath, {
        ...settings,
        auth: {
            ...settings.auth,
            tokens: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                accessTokenExpiresAt: tokens.accessTokenExpiresAt,
            },
        },
    })

    return {
        projectPath,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
        apiDomainMismatch: buildApiDomainMismatch(settings.api.baseUrl, tokens.apiDomain),
    }
}

async function waitForApproval(
    client: { clientId: string; clientSecret: string },
    deviceCode: DeviceCode
): Promise<TokenResponse> {
    const deadline = Date.now() + deviceCode.expiresInMs
    // Zoho dictates the cadence and answers slow_down when it is not respected.
    let intervalMs = deviceCode.pollIntervalMs

    for (;;) {
        await sleep(intervalMs)

        const result = await pollDeviceToken({ ...client, deviceCode: deviceCode.deviceCode })

        if (result.status === 'authorized') {
            return result.tokens
        }

        if (result.status === 'slow_down') {
            intervalMs *= 2
        }

        // Zoho also reports the timeout as an "expired" error, but only on the next poll.
        if (deviceCode.expiresInMs > 0 && Date.now() >= deadline) {
            throw new Error('The device code expired before it was approved. Run "zoho-studio login" again.')
        }
    }
}

function sleep(durationMs: number): Promise<void> {
    return new Promise((resolveSleep) => setTimeout(resolveSleep, durationMs))
}

function buildApiDomainMismatch(configuredBaseUrl: string, apiDomain: string): LoginResult['apiDomainMismatch'] {
    if (!apiDomain || normalizeUrl(apiDomain) === normalizeUrl(configuredBaseUrl)) {
        return null
    }

    return { expected: configuredBaseUrl, received: apiDomain }
}

function normalizeUrl(url: string): string {
    return url.trim().replace(/\/+$/, '').toLowerCase()
}
