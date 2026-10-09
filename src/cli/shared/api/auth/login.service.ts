import { workspaceSettingsRelativePath } from '@/config'
import {
    findProfile,
    listProfiles,
    resolveProfilesPath,
    saveConnection,
    warnAboutLegacyAuth,
    type CredentialProfile,
} from '@/credentials'
import { getProjectSettings } from '@/settings'

import { pollDeviceToken, requestDeviceCode } from './requests'
import type { DeviceCode, TokenResponse } from './auth.types'
import type { LoginOptions, LoginResult } from './login.types'

export async function login({ profile: profileName, onVerificationRequired }: LoginOptions = {}): Promise<LoginResult> {
    const { projectPath, settings } = await getProjectSettings()
    const { scopes } = settings.auth
    warnAboutLegacyAuth(settings)

    const profile = await resolveProfile(profileName)
    const { clientId, clientSecret } = profile

    if (scopes.length === 0) {
        throw new Error(`auth.scopes is empty in ${workspaceSettingsRelativePath}. List the scopes the CLI may use.`)
    }

    const deviceCode = await requestDeviceCode({ clientId, scopes })

    onVerificationRequired?.({
        verificationUrl: deviceCode.verificationUrl,
        userCode: deviceCode.userCode,
        expiresInMs: deviceCode.expiresInMs,
    })

    const tokens = await waitForApproval({ clientId, clientSecret }, deviceCode)

    await saveConnection(projectPath, {
        profile: profile.name,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
    })

    return {
        projectPath,
        profile: profile.name,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt,
        apiDomainMismatch: buildApiDomainMismatch(settings.api.baseUrl, tokens.apiDomain),
    }
}

/** Without a name, the only stored profile is the unambiguous choice. */
async function resolveProfile(name: string | undefined): Promise<CredentialProfile> {
    if (name) {
        const profile = await findProfile(name)

        if (!profile) {
            throw new Error(`There is no profile named "${name}".`)
        }

        return profile
    }

    const profiles = await listProfiles()

    if (profiles.length === 1) {
        return profiles[0]!
    }

    if (profiles.length === 0) {
        throw new Error(
            `There is no credential profile yet. Add your Zoho API Console client to ${resolveProfilesPath()} ` +
                'as [{ "name": "…", "clientId": "…", "clientSecret": "…" }].'
        )
    }

    throw new Error(
        `Several profiles exist (${profiles.map((profile) => profile.name).join(', ')}). Choose one with --profile.`
    )
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
