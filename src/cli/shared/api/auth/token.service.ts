import {
    findProfile,
    readConnection,
    saveConnection,
    warnAboutLegacyAuth,
    type ConnectionName,
    type ConnectionTokens,
} from '@/credentials'
import { getProjectSettings } from '@/settings'

import { refreshAccessToken } from './requests'

// Refreshing slightly early keeps a token from expiring between the check and the API call.
const expiryToleranceMs = 60_000

/**
 * Owns the stored tokens: hands out an access token that is valid right now, refreshing and
 * persisting it when the stored one has run out.
 */
export class TokenService {
    private readonly pendingRefreshes = new Map<string, Promise<string>>()

    /** `projects` falls back to the default connection while the project has no separate one. */
    async getAccessToken(requested: ConnectionName = 'default'): Promise<string> {
        const { projectPath, settings } = await getProjectSettings()
        warnAboutLegacyAuth(settings)

        const separate = requested === 'default' ? null : await readConnection(projectPath, requested)
        const connection: ConnectionName = separate ? requested : 'default'
        const tokens = separate ?? (await readConnection(projectPath))

        if (!tokens?.refreshToken) {
            throw new Error('This project is not authorized yet. Run "zoho-studio login" first.')
        }

        if (tokens.accessToken && Date.now() < tokens.accessTokenExpiresAt - expiryToleranceMs) {
            return tokens.accessToken
        }

        // A single run may ask for the token from several places, and Zoho caps refreshes per token.
        const key = `${projectPath}\0${connection}`
        let pending = this.pendingRefreshes.get(key)

        if (!pending) {
            pending = this.refresh(projectPath, connection, tokens).finally(() => this.pendingRefreshes.delete(key))
            this.pendingRefreshes.set(key, pending)
        }

        return pending
    }

    private async refresh(projectPath: string, connection: ConnectionName, tokens: ConnectionTokens): Promise<string> {
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

        await saveConnection(
            projectPath,
            { ...tokens, accessToken: refreshed.accessToken, accessTokenExpiresAt: refreshed.accessTokenExpiresAt },
            connection
        )

        return refreshed.accessToken
    }
}

export const tokenService = new TokenService()
