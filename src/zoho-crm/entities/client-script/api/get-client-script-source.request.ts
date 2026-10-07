import axios from 'axios'

/**
 * Returns the source of a client script as its author wrote it. The settings `/code` endpoint
 * answers a transpiled form instead, so the source is read from the script's hosting url — a file
 * outside Zoho CRM that the CRM web UI also reads without credentials, so no token is sent there.
 */
export async function getClientScriptSource(hostingUrl: string): Promise<string> {
    const { data } = await axios.get<string>(hostingUrl, {
        responseType: 'text',
        transformResponse: (body: unknown) => body,
    })

    return typeof data === 'string' ? data : String(data ?? '')
}
