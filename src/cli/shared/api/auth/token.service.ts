import { findProfile, readConnection, saveConnection, warnAboutLegacyAuth, type ConnectionTokens } from '@/credentials'
import { getProjectSettings } from '@/settings'

import { refreshAccessToken } from './requests'

// Refreshing slightly early keeps a token from expiring between the check and the API call.
const expiryToleranceMs = 60_000

/**
 * Owns the stored tokens: hands out an access token that is valid right now, refreshing and
 * persisting it when the stored one has run out.
 */
export class TokenService {
    private pendingRefresh: Promise<string> | null = null

    async getAccessToken(): Promise<string> {
        const { projectPath, settings } = await getProjectSettings()
        warnAboutLegacyAuth(settings)

        const tokens = await readConnection(projectPath)

        if (!tokens?.refreshToken) {
            throw new Error('This project is not authorized yet. Run "zoho-studio login" first.')
        }

        if (tokens.accessToken && Date.now() < tokens.accessTokenExpiresAt - expiryToleranceMs) {
            return tokens.accessToken
        }

        // A single run may ask for the token from several places, and Zoho caps refreshes per token.
        this.pendingRefresh ??= this.refresh(projectPath, tokens).finally(() => {
            this.pendingRefresh = null
        })

        return this.pendingRefresh
    }

    private async refresh(projectPath: string, tokens: ConnectionTokens): Promise<string> {
        const profile = await findProfile(tokens.profile)

        if (!profile) {
            throw new Error(
                `The profile "${tokens.profile}" this project was authorized with no longer exists. ` +
                    'Run "zoho-studio login" again.'
            )
        }

        const refreshed = await refreshAccessToken({
            clientId: profile.clientId,
            clientSecret: profile.clientSecret,
            refreshToken: tokens.refreshToken,
        })

        await saveConnection(projectPath, {
            ...tokens,
            accessToken: refreshed.accessToken,
            accessTokenExpiresAt: refreshed.accessTokenExpiresAt,
        })

        return refreshed.accessToken
    }
}

export const tokenService = new TokenService()
