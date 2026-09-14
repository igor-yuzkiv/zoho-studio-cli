import axios, { type InternalAxiosRequestConfig } from 'axios'

import type { ProjectSettings } from '@/settings'

import { tokenService } from '@/shared/api/auth'
import { getProjectSettings } from '@/settings'
import { logger } from '@/shared/logger'
import { delay } from '@/shared/utils'

import { resolveThrottleRetryAfterMs } from './projects.error'

const projectsClient = axios.create()

/**
 * Zoho allows 200 requests per API in a rolling 2-minute window (`URL_ROLLING_THROTTLES_LIMIT_EXCEEDED`),
 * i.e. one every 600 ms; the pause keeps a long comments run just under that.
 */
const pauseBetweenRequestsMs = 650

let lastRequestFinishedAt = 0

/** One retry after `Retry-After` is enough for a rolling window; a second refusal is reported instead of waited out. */
const maxThrottleRetries = 1

type RetriedConfig = InternalAxiosRequestConfig & { throttleRetries?: number }

export function resolveProjectsBaseUrl({ baseUrl, portalId, projectId }: ProjectSettings['projects']): string {
    return `${baseUrl}/api/v3/portal/${portalId}/projects/${projectId}`
}

projectsClient.interceptors.request.use(async (config) => {
    const { settings } = await getProjectSettings()
    const { portalId, projectId } = settings.projects

    if (!portalId) {
        throw new Error('projects.portalId is empty in .zoho-studio/settings.json.')
    }

    if (!projectId) {
        throw new Error('projects.projectId is empty in .zoho-studio/settings.json.')
    }

    config.baseURL = resolveProjectsBaseUrl(settings.projects)
    config.headers.set('Authorization', `Zoho-oauthtoken ${await tokenService.getAccessToken()}`)

    await delay(Math.max(0, lastRequestFinishedAt + pauseBetweenRequestsMs - Date.now()))

    return config
})

projectsClient.interceptors.response.use(
    (response) => {
        lastRequestFinishedAt = Date.now()

        return response
    },
    async (error) => {
        lastRequestFinishedAt = Date.now()

        const config = error?.config as RetriedConfig | undefined
        const retryAfterMs = resolveThrottleRetryAfterMs(error)

        const throttleRetries = config?.throttleRetries ?? 0

        if (!config || throttleRetries >= maxThrottleRetries || retryAfterMs === null) {
            throw error
        }

        logger.warn({ url: config.url, retryAfterMs }, 'Zoho Projects throttled the request, waiting before the retry')
        console.log(`Zoho Projects asked to wait ${Math.ceil(retryAfterMs / 1000)}s before the next request...`)
        await delay(retryAfterMs)

        return projectsClient.request({ ...config, throttleRetries: throttleRetries + 1 } as RetriedConfig)
    }
)

export { projectsClient }
