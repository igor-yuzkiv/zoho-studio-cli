/** Zoho reports a rejected request as an HTTP error whose body explains it far better than the status. */
export function describeRequestError(error: unknown): string {
    const payload = (error as { response?: { data?: { message?: unknown; code?: unknown } } })?.response?.data
    const message = typeof payload?.message === 'string' ? payload.message : null
    const code = typeof payload?.code === 'string' ? payload.code : null

    if (message) {
        return code ? `${message} (${code})` : message
    }

    return error instanceof Error ? error.message : String(error)
}
