import { getProjectSettings } from '@/settings'
import { replaceArtifactDir, writeArtifactBytes, writeArtifactJson } from '@/shared/artifacts'
import { createCommandLogger } from '@/shared/logger'
import type { PullProgress, PullResult } from '@/shared/pull'
import { staticResourcesDirName, zohoCrmDirName } from '@/zoho-crm/zoho-crm.config'

import { getStaticResourceContent, getStaticResourcesList } from '../api'
import type { StaticResource } from '../static-resource.types'
import { resolveContentSegments, resolveMetadataSegments } from '../static-resource.utils'

type FailedResource = {
    name: string
    source: string
    message: string
}

export async function pullStaticResources(progress: PullProgress): Promise<PullResult> {
    const logger = await createCommandLogger('z-crm:static-resources:pull')
    logger.info('Starting static resources pull')

    const { projectPath } = await getProjectSettings()

    let resources: StaticResource[]

    try {
        resources = await getStaticResourcesList()
    } catch (error) {
        logger.error({ err: error }, 'Failed to fetch the static resources list')
        throw error
    }

    logger.info({ total: resources.length }, 'Static resources found')

    // The directory mirrors exactly what this pull returned, so stale resources are dropped.
    await replaceArtifactDir(projectPath, [zohoCrmDirName, staticResourcesDirName])

    const failed: FailedResource[] = []

    progress.start(resources.length)

    try {
        for (const resource of resources) {
            progress.update(resource.name)
            await writeArtifactJson(projectPath, resolveMetadataSegments(resource), resource)

            try {
                if (!resource.uri) {
                    throw new Error('Zoho returned no uri for the file')
                }

                const content = await getStaticResourceContent(resource.uri)
                await writeArtifactBytes(projectPath, resolveContentSegments(resource), content)
            } catch (error) {
                failed.push({
                    name: resource.name,
                    source: resource.source,
                    message: error instanceof Error ? error.message : String(error),
                })
                logger.error({ err: error, resourceId: resource.id }, 'Failed to fetch static resource file')
            }

            progress.increment()
        }
    } finally {
        progress.stop()
    }

    const downloaded = resources.length - failed.length
    logger.info({ total: resources.length, downloaded, failed: failed.length }, 'Static resources pull finished')

    return {
        summary: [
            `Static resources found: ${resources.length}`,
            `Metadata saved: ${resources.length}`,
            `Files downloaded: ${downloaded}`,
            `Files failed: ${failed.length}`,
            ...failed.map((failure) => `  - ${failure.name} (${failure.source}): ${failure.message}`),
        ],
        failedCount: failed.length,
    }
}
