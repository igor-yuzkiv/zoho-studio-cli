import { authClient } from '../auth.client'
import { AuthError } from '../auth.error'
import type { DeviceTokenPollResult, DeviceTokenRequest } from '../auth.types'

interface DeviceTokenPayload {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    api_domain?: string
    token_type?: string
}

// Zoho answers a poll that is simply too early with an error code, which is not a failure here.
const waitingResults: Record<string, DeviceTokenPollResult> = {
    authorization_pending: { status: 'pending' },
    slow_down: { status: 'slow_down' },
}

export async function pollDeviceToken({
    clientId,
    clientSecret,
    deviceCode,
}: DeviceTokenRequest): Promise<DeviceTokenPollResult> {
    let data: DeviceTokenPayload

    try {
        data = (
            await authClient.post<DeviceTokenPayload>('/oauth/v3/device/token', null, {
                params: {
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: 'device_token',
                    code: deviceCode,
                },
            })
        ).data
    } catch (error) {
        const waitingResult = error instanceof AuthError ? waitingResults[error.code] : undefined

        if (!waitingResult) {
            throw error
        }

        return waitingResult
    }

    if (!data?.access_token || !data.refresh_token) {
        throw new Error('Zoho returned a token response without an access token or a refresh token.')
    }

    return {
        status: 'authorized',
        tokens: {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            accessTokenExpiresAt: Date.now() + (data.expires_in ?? 0) * 1000,
            apiDomain: data.api_domain ?? '',
            tokenType: data.token_type ?? '',
        },
    }
}
