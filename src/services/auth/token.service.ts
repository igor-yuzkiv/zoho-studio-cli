import { refreshAccessToken } from '@/api/auth'
import { projectSettingsGitignoreEntry } from '@/config'
import { saveProjectSettings, type ProjectSettings } from '@/settings'

// Refreshing slightly early keeps a token from expiring between the check and the API call.
const expiryToleranceMs = 60_000

/**
 * Owns the stored tokens: hands out an access token that is valid right now, refreshing and
 * persisting it when the stored one has run out.
 */
export class TokenService {
    private tokens: ProjectSettings['auth']['tokens']
    private pendingRefresh: Promise<string> | null = null

    constructor(
        private readonly projectPath: string,
        private readonly settings: ProjectSettings
    ) {
        this.tokens = settings.auth.tokens
    }

    async getAccessToken(): Promise<string> {
        if (this.tokens.accessToken && !this.isExpired()) {
            return this.tokens.accessToken
        }

        // A single run may ask for the token from several places, and Zoho caps refreshes per token.
        this.pendingRefresh ??= this.refresh().finally(() => {
            this.pendingRefresh = null
        })

        return this.pendingRefresh
    }

    private isExpired(): boolean {
        return Date.now() >= this.tokens.accessTokenExpiresAt - expiryToleranceMs
    }

    private async refresh(): Promise<string> {
        const { baseUrl, clientId, clientSecret } = this.settings.auth

        if (!this.tokens.refreshToken) {
            throw new Error(`No refresh token in ${projectSettingsGitignoreEntry}. Run "zoho-studio login" first.`)
        }

        const refreshed = await refreshAccessToken({
            baseUrl,
            clientId,
            clientSecret,
            refreshToken: this.tokens.refreshToken,
        })

        this.tokens = {
            ...this.tokens,
            accessToken: refreshed.accessToken,
            accessTokenExpiresAt: refreshed.accessTokenExpiresAt,
        }

        await saveProjectSettings(this.projectPath, {
            ...this.settings,
            auth: { ...this.settings.auth, tokens: this.tokens },
        })

        return this.tokens.accessToken
    }
}
