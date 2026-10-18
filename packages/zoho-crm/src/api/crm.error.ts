/**
 * Zoho reports a rejected request as an HTTP error whose body explains it far better than the status.
 * The details, when present, usually name the offending field.
 */
export function describeRequestError(error: unknown): string {
    const payload = (error as { response?: { data?: { message?: unknown; code?: unknown; details?: unknown } } })
        ?.response?.data
    const message = typeof payload?.message === 'string' ? payload.message : null
    const code = typeof payload?.code === 'string' ? payload.code : null

    if (message) {
        const details =
            payload?.details && typeof payload.details === 'object' && Object.keys(payload.details).length > 0
                ? ` — details: ${JSON.stringify(payload.details)}`
                : ''

        return `${code ? `${message} (${code})` : message}${details}`
    }

    return error instanceof Error ? error.message : String(error)
}
