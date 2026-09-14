import axios, { type InternalAxiosRequestConfig } from 'axios'

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

type RetriedConfig = InternalAxiosRequestConfig & { throttleRetried?: boolean }

projectsClient.interceptors.request.use(async (config) => {
    const { settings } = await getProjectSettings()
    const { baseUrl, portalId, projectId } = settings.projects

    if (!portalId) {
        throw new Error('projects.portalId is empty in .zoho-studio/settings.json.')
    }

    if (!projectId) {
        throw new Error('projects.projectId is empty in .zoho-studio/settings.json.')
    }

    config.baseURL = `${baseUrl}/api/v3/portal/${portalId}/projects/${projectId}`
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

        if (!config || config.throttleRetried || retryAfterMs === null) {
            throw error
        }

        logger.warn({ url: config.url, retryAfterMs }, 'Zoho Projects throttled the request, waiting before the retry')
        console.log(`Zoho Projects asked to wait ${Math.ceil(retryAfterMs / 1000)}s before the next request...`)
        await delay(retryAfterMs)

        return projectsClient.request({ ...config, throttleRetried: true } as RetriedConfig)
    }
)

export { projectsClient }
