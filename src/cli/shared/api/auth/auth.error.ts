import { AxiosError } from 'axios'

const errorHints: Record<string, string> = {
    invalid_client: 'Check auth.clientId, and that auth.baseUrl points to the data center your client was registered in.',
    invalid_client_secret: 'Check auth.clientSecret in settings.json.',
    invalid_scope: 'Check auth.scopes in settings.json — one of the scopes does not exist.',
    invalid_code: 'Start "zoho-studio login" again to request a new device code.',
    expired: 'The device code expired before it was approved. Run "zoho-studio login" again.',
    access_denied: 'The request was denied in the browser. Run "zoho-studio login" again to retry.',
    other_dc: 'Your account lives in another data center. Point auth.baseUrl and api.baseUrl at that region.',
}

/** Zoho refused the request and named a reason — the code is what callers branch on. */
export class AuthError extends Error {
    constructor(
        readonly code: string,
        message: string = describeAuthErrorCode(code)
    ) {
        super(message)
        this.name = 'AuthError'
    }
}

/** The request never produced a Zoho answer: the server was unreachable or replied with a bare status. */
export class AuthTransportError extends Error {
    constructor(
        message: string,
        readonly status: number | null = null
    ) {
        super(message)
        this.name = 'AuthTransportError'
    }

    static fromAxios(error: unknown): Error {
        if (error instanceof AxiosError) {
            return new AuthTransportError(`Could not reach the Zoho accounts server: ${error.message}.`)
        }

        return error instanceof Error ? error : new AuthTransportError(String(error))
    }
}

function describeAuthErrorCode(code: string): string {
    const hint = errorHints[code]

    return hint ? `Zoho rejected the request: ${code}. ${hint}` : `Zoho rejected the request: ${code}.`
}
