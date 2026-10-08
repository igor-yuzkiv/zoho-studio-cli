import axios from 'axios'

import { getProjectSettings } from '@/settings'

import { AuthError, AuthTransportError } from './auth.error'

// Zoho reports OAuth failures as HTTP 200 with an `error` field, so the status is inspected by hand.
const authClient = axios.create({ validateStatus: () => true })

authClient.interceptors.request.use(async (config) => {
    const { settings } = await getProjectSettings()
    config.baseURL = settings.auth.baseUrl

    return config
})

authClient.interceptors.response.use(
    (response) => {
        const errorCode = (response.data as { error?: string } | null)?.error

        if (errorCode) {
            throw new AuthError(errorCode)
        }

        if (response.status >= 400) {
            throw new AuthTransportError(`Zoho rejected the request with HTTP ${response.status}.`, response.status)
        }

        return response
    },
    (error: unknown) => Promise.reject(AuthTransportError.fromAxios(error))
)

export { authClient }
