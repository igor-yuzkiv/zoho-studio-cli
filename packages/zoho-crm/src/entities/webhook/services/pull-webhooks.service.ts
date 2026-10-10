import { getProjectSettings } from '@zoho-studio/core'
import { describeRequestError } from '../../../api'
import {
    replaceArtifactDir,
    resolveArtifactFileName,
    sortForStableFileNames,
    writeArtifactJson,
} from '@zoho-studio/core'
import { createCommandLogger } from '@zoho-studio/core'
import type { PullProgress, PullResult } from '@zoho-studio/core'
import { delay } from '@zoho-studio/core'
import { webhooksDirName, zohoCrmDirName } from '../../../zoho-crm.config'

import { getWebhook, getWebhooksList } from '../api'
import type { ZohoWebhook } from '../webhook.types'

const delayBetweenWebhookRequestsMs = 300

type FailedWebhook = {
    name: string
    message: string
}

export async function pullWebhooks(progress: PullProgress): Promise<PullResult> {
    const logger = await createCommandLogger('z-crm:webhooks:pull')
    logger.info('Starting webhooks pull')

    const { projectPath } = await getProjectSettings()

    let webhooks: ZohoWebhook[]

    try {
        webhooks = sortForStableFileNames(await getWebhooksList())
    } catch (error) {
        logger.error({ err: error }, 'Failed to fetch the webhooks list')
        throw new Error(describeRequestError(error), { cause: error })
    }

    logger.info({ total: webhooks.length }, 'Webhooks found')

    await replaceArtifactDir(projectPath, [zohoCrmDirName, webhooksDirName])

    const takenFileNames = new Set<string>()
    const failed: FailedWebhook[] = []
    let savedWebhooks = 0

    progress.start(webhooks.length)

    try {
        for (const [index, webhook] of webhooks.entries()) {
            if (index > 0) {
                await delay(delayBetweenWebhookRequestsMs)
            }

            progress.update(webhook.name)

            try {
                // The list carries no body, headers, or authentication, so the full record is
                // fetched per webhook.
                const details = await getWebhook(webhook.id)
                const fileName = resolveArtifactFileName(webhook.name, webhook.id, takenFileNames)

                await writeArtifactJson(projectPath, [zohoCrmDirName, webhooksDirName, fileName], details)

                takenFileNames.add(fileName)
                savedWebhooks += 1
            } catch (error) {
                failed.push({ name: webhook.name, message: describeRequestError(error) })
                logger.error({ err: error, webhook: webhook.name }, 'Failed to pull a webhook')
            }

            progress.increment()
        }
    } finally {
        progress.stop()
    }

    logger.info({ total: webhooks.length, saved: savedWebhooks, failed: failed.length }, 'Webhooks pull finished')

    return {
        summary: [
            `Webhooks found: ${webhooks.length}`,
            `Webhooks saved: ${savedWebhooks}`,
            `Webhooks failed: ${failed.length}`,
            ...failed.map((failure) => `  - ${failure.name}: ${failure.message}`),
        ],
        failedCount: failed.length,
    }
}
