import { isAxiosError } from 'axios'

interface ProjectsErrorPayload {
    error?: { title?: unknown; error_type?: unknown }
}

/** Zoho Projects throttles with `429`, or with `400` whose title says so; both carry `Retry-After` in seconds. */
export function resolveThrottleRetryAfterMs(error: unknown): number | null {
    if (!isAxiosError(error) || !error.response) {
        return null
    }

    const { status, data, headers } = error.response
    const title = (data as ProjectsErrorPayload | undefined)?.error?.title
    const throttled = status === 429 || (status === 400 && title === 'URL_ROLLING_THROTTLES_LIMIT_EXCEEDED')

    if (!throttled) {
        return null
    }

    const retryAfterSeconds = Number(headers['retry-after'])

    return Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : null
}

/** A Projects error names itself in `error.title`; the message stays readable and never carries the request. */
export function describeProjectsRequestError(error: unknown): string {
    if (isAxiosError(error) && error.response) {
        const title = (error.response.data as ProjectsErrorPayload | undefined)?.error?.title

        return typeof title === 'string' ? `${title} (${error.response.status})` : `HTTP ${error.response.status}`
    }

    return error instanceof Error ? error.message : String(error)
}
