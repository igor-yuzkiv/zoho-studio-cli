import cliProgress from 'cli-progress'
import { Command } from 'commander'

import { clientScriptsDirName, zohoCrmDirName } from '@/zoho-crm/zoho-crm.config'
import {
    clientScriptPageMetadataFileName,
    getClientScriptPagesList,
    getClientScriptSource,
    getClientScriptsList,
    resolvePageDirSegments,
    resolveScriptMetadataSegments,
    resolveScriptSourceSegments,
    type ClientScript,
    type ClientScriptPage,
} from '@/zoho-crm/entities/client-script'
import { getProjectSettings } from '@/settings'
import { replaceArtifactDir, writeArtifactJson, writeArtifactText } from '@/shared/artifacts'
import { createCommandLogger } from '@/shared/logger'
import { delay } from '@/shared/utils'

const delayBetweenPageRequestsMs = 300

type Failure = {
    subject: string
    message: string
}

export const pullClientScriptsCommand = new Command('z-crm:client-scripts:pull')
    .description('Download every Zoho CRM client script into the project client scripts directory')
    .action(async () => {
        const logger = await createCommandLogger('z-crm:client-scripts:pull')
        logger.info('Starting client scripts pull')

        const { projectPath } = await getProjectSettings()

        let pages: ClientScriptPage[]

        try {
            pages = await getClientScriptPagesList()
        } catch (error) {
            logger.error({ err: error }, 'Failed to fetch the client script pages list')
            throw error
        }

        logger.info({ total: pages.length }, 'Client script pages found')

        // The directory mirrors exactly what this pull returned, so stale scripts are dropped.
        await replaceArtifactDir(projectPath, [zohoCrmDirName, clientScriptsDirName])

        const pageDirSegments = resolvePageDirSegments(pages)
        const failed: Failure[] = []
        let scriptsFound = 0
        let sourcesDownloaded = 0

        const progressBar = new cliProgress.SingleBar(
            {
                format: 'Pulling client script pages |{bar}| {value}/{total} | {name}',
                hideCursor: true,
                clearOnComplete: false,
            },
            cliProgress.Presets.shades_classic
        )

        progressBar.start(pages.length, 0, { name: 'Starting...' })

        try {
            for (const [index, page] of pages.entries()) {
                if (index > 0) {
                    await delay(delayBetweenPageRequestsMs)
                }

                const dirSegments = pageDirSegments.get(page.id) ?? []
                const pageLabel = dirSegments.slice(2).join('/')

                progressBar.update({ name: pageLabel })
                await writeArtifactJson(projectPath, [...dirSegments, clientScriptPageMetadataFileName], page)

                let scripts: ClientScript[]

                try {
                    scripts = await getClientScriptsList(page.id)
                } catch (error) {
                    failed.push({ subject: `page ${pageLabel}`, message: toMessage(error) })
                    logger.error({ err: error, pageId: page.id }, 'Failed to fetch the client scripts of a page')
                    progressBar.increment()
                    continue
                }

                scriptsFound += scripts.length

                for (const script of scripts) {
                    await writeArtifactJson(projectPath, resolveScriptMetadataSegments(dirSegments, script), script)

                    try {
                        const hostingUrl = script.hosting?.url

                        if (!hostingUrl) {
                            throw new Error('Zoho returned no hosting url for the source')
                        }

                        const source = await getClientScriptSource(hostingUrl)
                        await writeArtifactText(projectPath, resolveScriptSourceSegments(dirSegments, script), source)
                        sourcesDownloaded += 1
                    } catch (error) {
                        failed.push({
                            subject: `${pageLabel}/${script.name} (${script.id})`,
                            message: toMessage(error),
                        })
                        logger.error({ err: error, scriptId: script.id }, 'Failed to fetch client script source')
                    }
                }

                progressBar.increment()
            }
        } finally {
            progressBar.stop()
        }

        logger.info(
            { pages: pages.length, scripts: scriptsFound, downloaded: sourcesDownloaded, failed: failed.length },
            'Client scripts pull finished'
        )

        console.log(`Pages found: ${pages.length}`)
        console.log(`Scripts found: ${scriptsFound}`)
        console.log(`Source downloaded: ${sourcesDownloaded}`)
        console.log(`Failed: ${failed.length}`)

        for (const failure of failed) {
            console.log(`  - ${failure.subject}: ${failure.message}`)
        }
    })

function toMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}
