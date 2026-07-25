import { describeZohoError, postOAuth, trimTrailingSlash } from '../auth.utils'
import type { DeviceCode, DeviceCodeRequest } from '../auth.types'

interface DeviceCodePayload {
    device_code?: string
    user_code?: string
    verification_url?: string
    interval?: number
    expires_in?: number
    error?: string
}

/** Starts the device flow: Zoho issues a code the user approves in a browser elsewhere. */
export async function requestDeviceCode({ baseUrl, clientId, scopes }: DeviceCodeRequest): Promise<DeviceCode> {
    const payload = await postOAuth<DeviceCodePayload>(`${trimTrailingSlash(baseUrl)}/oauth/v3/device/code`, {
        client_id: clientId,
        grant_type: 'device_request',
        scope: scopes.join(','),
        // Without it Zoho issues an access token only, and the CLI could never refresh.
        access_type: 'offline',
    })

    if (payload?.error) {
        throw new Error(describeZohoError(payload.error))
    }

    if (!payload?.device_code || !payload.user_code || !payload.verification_url) {
        throw new Error('Zoho returned an incomplete device code response.')
    }

    return {
        deviceCode: payload.device_code,
        userCode: payload.user_code,
        verificationUrl: payload.verification_url,
        pollIntervalMs: payload.interval ?? 5_000,
        expiresInMs: payload.expires_in ?? 0,
    }
}
