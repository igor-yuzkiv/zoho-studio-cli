import { describeZohoError, postOAuth, trimTrailingSlash } from '../auth.utils'
import type { AccessToken, RefreshAccessTokenRequest } from '../auth.types'

interface RefreshPayload {
    access_token?: string
    expires_in?: number
    api_domain?: string
    token_type?: string
    error?: string
}

/** Zoho keeps the refresh token unchanged and answers with a new access token only. */
export async function refreshAccessToken({
    baseUrl,
    clientId,
    clientSecret,
    refreshToken,
}: RefreshAccessTokenRequest): Promise<AccessToken> {
    const payload = await postOAuth<RefreshPayload>(`${trimTrailingSlash(baseUrl)}/oauth/v2/token`, {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
    })

    if (payload?.error === 'invalid_code') {
        throw new Error(
            'The stored refresh token is no longer valid — it was revoked or belongs to another client. ' +
                'Run "zoho-studio login" again.'
        )
    }

    if (payload?.error) {
        throw new Error(describeZohoError(payload.error))
    }

    if (!payload?.access_token) {
        throw new Error('Zoho returned a refresh response without an access token.')
    }

    return {
        accessToken: payload.access_token,
        accessTokenExpiresAt: Date.now() + (payload.expires_in ?? 0) * 1000,
        apiDomain: payload.api_domain ?? '',
        tokenType: payload.token_type ?? '',
    }
}
