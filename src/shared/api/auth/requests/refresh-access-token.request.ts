import { authClient } from '../auth.client'
import { AuthError } from '../auth.error'
import type { AccessToken, RefreshAccessTokenRequest } from '../auth.types'

interface RefreshPayload {
    access_token?: string
    expires_in?: number
    api_domain?: string
    token_type?: string
}

/** Zoho keeps the refresh token unchanged and answers with a new access token only. */
export async function refreshAccessToken(request: RefreshAccessTokenRequest): Promise<AccessToken> {
    const data = await requestAccessToken(request)

    if (!data?.access_token) {
        throw new Error('Zoho returned a refresh response without an access token.')
    }

    return {
        accessToken: data.access_token,
        accessTokenExpiresAt: Date.now() + (data.expires_in ?? 0) * 1000,
        apiDomain: data.api_domain ?? '',
        tokenType: data.token_type ?? '',
    }
}

async function requestAccessToken({
    clientId,
    clientSecret,
    refreshToken,
}: RefreshAccessTokenRequest): Promise<RefreshPayload> {
    try {
        const { data } = await authClient.post<RefreshPayload>('/oauth/v2/token', null, {
            params: {
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            },
        })

        return data
    } catch (error) {
        // On this endpoint invalid_code is about the refresh token, not a device code.
        if (error instanceof AuthError && error.code === 'invalid_code') {
            throw new AuthError(
                error.code,
                'The stored refresh token is no longer valid — it was revoked or belongs to another client. ' +
                    'Run "zoho-studio login" again.'
            )
        }

        throw error
    }
}
