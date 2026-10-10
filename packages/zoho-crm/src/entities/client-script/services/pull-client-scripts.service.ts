import { getProjectSettings } from '@zoho-studio/core'
import { replaceArtifactDir, writeArtifactJson, writeArtifactText } from '@zoho-studio/core'
import { createCommandLogger } from '@zoho-studio/core'
import type { PullProgress, PullResult } from '@zoho-studio/core'
import { delay } from '@zoho-studio/core'
import { clientScriptsDirName, zohoCrmDirName } from '../../../zoho-crm.config'

import { getClientScriptPagesList, getClientScriptSource, getClientScriptsList } from '../api'
import type { ClientScript, ClientScriptPage } from '../client-script.types'
import {
    clientScriptPageMetadataFileName,
    resolvePageDirSegments,
    resolveScriptMetadataSegments,
    resolveScriptSourceSegments,
} from '../client-script.utils'

const delayBetweenPageRequestsMs = 300

type Failure = {
    subject: string
    message: string
}

export async function pullClientScripts(progress: PullProgress): Promise<PullResult> {
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

    progress.start(pages.length)

    try {
        for (const [index, page] of pages.entries()) {
            if (index > 0) {
                await delay(delayBetweenPageRequestsMs)
            }

            const dirSegments = pageDirSegments.get(page.id) ?? []
            const pageLabel = dirSegments.slice(2).join('/')

            progress.update(pageLabel)
            await writeArtifactJson(projectPath, [...dirSegments, clientScriptPageMetadataFileName], page)

            let scripts: ClientScript[]

            try {
                scripts = await getClientScriptsList(page.id)
            } catch (error) {
                failed.push({ subject: `page ${pageLabel}`, message: toMessage(error) })
                logger.error({ err: error, pageId: page.id }, 'Failed to fetch the client scripts of a page')
                progress.increment()
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

            progress.increment()
        }
    } finally {
        progress.stop()
    }

    logger.info(
        { pages: pages.length, scripts: scriptsFound, downloaded: sourcesDownloaded, failed: failed.length },
        'Client scripts pull finished'
    )

    return {
        summary: [
            `Pages found: ${pages.length}`,
            `Scripts found: ${scriptsFound}`,
            `Source downloaded: ${sourcesDownloaded}`,
            `Failed: ${failed.length}`,
            ...failed.map((failure) => `  - ${failure.subject}: ${failure.message}`),
        ],
        failedCount: failed.length,
    }
}

function toMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}
