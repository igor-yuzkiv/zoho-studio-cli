import cliProgress from 'cli-progress'
import { Command } from 'commander'

import { webhooksDirName } from '@/config'
import { getWebhook, getWebhooksList, type ZohoWebhook } from '@/entities/webhook'
import { describeRequestError } from '@/shared/api/crm'
import { getProjectSettings } from '@/settings'
import {
    replaceArtifactDir,
    resolveArtifactFileName,
    sortForStableFileNames,
    writeArtifactJson,
} from '@/shared/artifacts'
import { createCommandLogger } from '@/shared/logger'
import { delay } from '@/shared/utils'

const delayBetweenWebhookRequestsMs = 300

type FailedWebhook = {
    name: string
    message: string
}

export const pullWebhooksCommand = new Command('webhooks:pull')
    .description('Download every Zoho CRM webhook, with its request body and authentication, into the project')
    .action(async () => {
        const logger = await createCommandLogger('webhooks:pull')
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

        await replaceArtifactDir(projectPath, [webhooksDirName])

        const takenFileNames = new Set<string>()
        const failed: FailedWebhook[] = []
        let savedWebhooks = 0
        const progressBar = new cliProgress.SingleBar(
            {
                format: 'Pulling webhooks |{bar}| {value}/{total} | {name}',
                hideCursor: true,
                clearOnComplete: false,
            },
            cliProgress.Presets.shades_classic
        )

        progressBar.start(webhooks.length, 0, { name: 'Starting...' })

        try {
            for (const [index, webhook] of webhooks.entries()) {
                if (index > 0) {
                    await delay(delayBetweenWebhookRequestsMs)
                }

                progressBar.update({ name: webhook.name })

                try {
                    // The list carries no body, headers, or authentication, so the full record is
                    // fetched per webhook.
                    const details = await getWebhook(webhook.id)
                    const fileName = resolveArtifactFileName(webhook.name, webhook.id, takenFileNames)

                    await writeArtifactJson(projectPath, [webhooksDirName, fileName], details)

                    takenFileNames.add(fileName)
                    savedWebhooks += 1
                } catch (error) {
                    failed.push({ name: webhook.name, message: describeRequestError(error) })
                    logger.error({ err: error, webhook: webhook.name }, 'Failed to pull a webhook')
                }

                progressBar.increment()
            }
        } finally {
            progressBar.stop()
        }

        logger.info({ total: webhooks.length, saved: savedWebhooks, failed: failed.length }, 'Webhooks pull finished')

        console.log(`Webhooks found: ${webhooks.length}`)
        console.log(`Webhooks saved: ${savedWebhooks}`)
        console.log(`Webhooks failed: ${failed.length}`)

        for (const failure of failed) {
            console.log(`  - ${failure.name}: ${failure.message}`)
        }
    })

