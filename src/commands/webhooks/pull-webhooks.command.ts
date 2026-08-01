import cliProgress from 'cli-progress'
import { Command } from 'commander'

import { webhooksDirName } from '@/config'
import { getWebhook, getWebhooksList, type ZohoWebhook } from '@/entities/webhook'
import { getProjectSettings } from '@/settings'
import { replaceArtifactDir, writeArtifactJson } from '@/shared/artifacts'
import { createCommandLogger } from '@/shared/logger'

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
            webhooks = sortWebhooks(await getWebhooksList())
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
                    const fileName = resolveWebhookFileName(webhook.name, webhook.id, takenFileNames)

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

/**
 * Webhook names are not guaranteed to be unique, so a flat directory can collide. The second
 * claimant of a name carries the webhook id instead of overwriting the first one.
 */
export function resolveWebhookFileName(name: string, id: string, takenFileNames: Set<string>): string {
    const baseName = toFileBaseName(name, id)
    const fileName = `${baseName}.json`

    return takenFileNames.has(fileName) ? `${baseName}.${id}.json` : fileName
}

/** Ordered so that a name collision is always resolved the same way between runs. */
export function sortWebhooks(webhooks: ZohoWebhook[]): ZohoWebhook[] {
    return [...webhooks].sort(
        (left, right) =>
            (left.module?.api_name ?? '').localeCompare(right.module?.api_name ?? '') ||
            left.name.localeCompare(right.name) ||
            left.id.localeCompare(right.id)
    )
}

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

function toFileBaseName(name: string, id: string): string {
    const baseName = name.replace(/[/\\\0]/g, '_').trim()

    return !baseName || baseName === '.' || baseName === '..' ? id : baseName
}

function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
