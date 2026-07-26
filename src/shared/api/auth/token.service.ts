import { projectSettingsGitignoreEntry } from '@/config'
import { getProjectSettings, saveProjectSettings, type ProjectContext } from '@/settings'

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
        const context = await getProjectSettings()
        const { accessToken, accessTokenExpiresAt } = context.settings.auth.tokens

        if (accessToken && Date.now() < accessTokenExpiresAt - expiryToleranceMs) {
            return accessToken
        }

        // A single run may ask for the token from several places, and Zoho caps refreshes per token.
        this.pendingRefresh ??= this.refresh(context).finally(() => {
            this.pendingRefresh = null
        })

        return this.pendingRefresh
    }

    private async refresh({ projectPath, settings }: ProjectContext): Promise<string> {
        const { clientId, clientSecret, tokens } = settings.auth

        if (!tokens.refreshToken) {
            throw new Error(`No refresh token in ${projectSettingsGitignoreEntry}. Run "zoho-studio login" first.`)
        }

        const refreshed = await refreshAccessToken({ clientId, clientSecret, refreshToken: tokens.refreshToken })

        await saveProjectSettings(projectPath, {
            ...settings,
            auth: {
                ...settings.auth,
                tokens: {
                    ...tokens,
                    accessToken: refreshed.accessToken,
                    accessTokenExpiresAt: refreshed.accessTokenExpiresAt,
                },
            },
        })

        return refreshed.accessToken
    }
}

export const tokenService = new TokenService()
