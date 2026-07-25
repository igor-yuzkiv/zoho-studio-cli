import axios from 'axios'

const errorHints: Record<string, string> = {
    invalid_client: 'Check auth.clientId, and that auth.baseUrl points to the data center your client was registered in.',
    invalid_client_secret: 'Check auth.clientSecret in settings.json.',
    invalid_scope: 'Check auth.scopes in settings.json — one of the scopes does not exist.',
    invalid_code: 'Start "zoho-studio login" again to request a new device code.',
    expired: 'The device code expired before it was approved. Run "zoho-studio login" again.',
    access_denied: 'The request was denied in the browser. Run "zoho-studio login" again to retry.',
    other_dc: 'Your account lives in another data center. Point auth.baseUrl and api.baseUrl at that region.',
}

/**
 * Zoho reports OAuth failures as HTTP 200 with an `error` field, so the status alone never tells
 * whether a request succeeded.
 */
export async function postOAuth<TPayload extends { error?: string }>(
    url: string,
    params: Record<string, string>
): Promise<TPayload> {
    const response = await axios.post<TPayload>(url, null, { params, validateStatus: () => true })

    if (!response.data && response.status >= 400) {
        throw new Error(`Zoho rejected the request with HTTP ${response.status}.`)
    }

    return response.data
}

export function describeZohoError(error: string): string {
    const hint = errorHints[error]

    return hint ? `Zoho rejected the request: ${error}. ${hint}` : `Zoho rejected the request: ${error}.`
}

export function trimTrailingSlash(url: string): string {
    return url.replace(/\/+$/, '')
}
