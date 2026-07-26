import { authClient } from '../auth.client'
import type { DeviceCode, DeviceCodeRequest } from '../auth.types'

interface DeviceCodePayload {
    device_code?: string
    user_code?: string
    verification_url?: string
    interval?: number
    expires_in?: number
}

/** Starts the device flow: Zoho issues a code the user approves in a browser elsewhere. */
export async function requestDeviceCode({ clientId, scopes }: DeviceCodeRequest): Promise<DeviceCode> {
    const { data } = await authClient.post<DeviceCodePayload>('/oauth/v3/device/code', null, {
        params: {
            client_id: clientId,
            grant_type: 'device_request',
            scope: scopes.join(','),
            // Without it Zoho issues an access token only, and the CLI could never refresh.
            access_type: 'offline',
        },
    })

    if (!data?.device_code || !data.user_code || !data.verification_url) {
        throw new Error('Zoho returned an incomplete device code response.')
    }

    return {
        deviceCode: data.device_code,
        userCode: data.user_code,
        verificationUrl: data.verification_url,
        pollIntervalMs: data.interval ?? 5_000,
        expiresInMs: data.expires_in ?? 0,
    }
}
