import { describeZohoError, postOAuth, trimTrailingSlash } from '../auth.utils'
import type { DeviceTokenPollResult, DeviceTokenRequest } from '../auth.types'

interface DeviceTokenPayload {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    api_domain?: string
    token_type?: string
    error?: string
}

export async function pollDeviceToken({
    baseUrl,
    clientId,
    clientSecret,
    deviceCode,
}: DeviceTokenRequest): Promise<DeviceTokenPollResult> {
    const payload = await postOAuth<DeviceTokenPayload>(`${trimTrailingSlash(baseUrl)}/oauth/v3/device/token`, {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'device_token',
        code: deviceCode,
    })

    if (payload?.error === 'authorization_pending') {
        return { status: 'pending' }
    }

    if (payload?.error === 'slow_down') {
        return { status: 'slow_down' }
    }

    if (payload?.error) {
        throw new Error(describeZohoError(payload.error))
    }

    if (!payload?.access_token || !payload.refresh_token) {
        throw new Error('Zoho returned a token response without an access token or a refresh token.')
    }

    return {
        status: 'authorized',
        tokens: {
            accessToken: payload.access_token,
            refreshToken: payload.refresh_token,
            accessTokenExpiresAt: Date.now() + (payload.expires_in ?? 0) * 1000,
            apiDomain: payload.api_domain ?? '',
            tokenType: payload.token_type ?? '',
        },
    }
}
