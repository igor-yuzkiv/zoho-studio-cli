import cliProgress from 'cli-progress'
import { Command } from 'commander'

import { staticResourcesDirName, zohoCrmDirName } from '@/zoho-crm/zoho-crm.config'
import {
    getStaticResourceContent,
    getStaticResourcesList,
    resolveContentSegments,
    resolveMetadataSegments,
    type StaticResource,
} from '@/zoho-crm/entities/static-resource'
import { getProjectSettings } from '@/settings'
import { replaceArtifactDir, writeArtifactBytes, writeArtifactJson } from '@/shared/artifacts'
import { createCommandLogger } from '@/shared/logger'

type FailedResource = {
    name: string
    source: string
    message: string
}

export const pullStaticResourcesCommand = new Command('z-crm:static-resources:pull')
    .description('Download every Zoho CRM static resource into the project static resources directory')
    .action(async () => {
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
        const progressBar = new cliProgress.SingleBar(
            {
                format: 'Pulling static resources |{bar}| {value}/{total} | {name}',
                hideCursor: true,
                clearOnComplete: false,
            },
            cliProgress.Presets.shades_classic
        )

        progressBar.start(resources.length, 0, { name: 'Starting...' })

        try {
            for (const resource of resources) {
                progressBar.update({ name: resource.name })
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

                progressBar.increment()
            }
        } finally {
            progressBar.stop()
        }

        const downloaded = resources.length - failed.length
        logger.info({ total: resources.length, downloaded, failed: failed.length }, 'Static resources pull finished')

        console.log(`Static resources found: ${resources.length}`)
        console.log(`Metadata saved: ${resources.length}`)
        console.log(`Files downloaded: ${downloaded}`)
        console.log(`Files failed: ${failed.length}`)

        for (const failure of failed) {
            console.log(`  - ${failure.name} (${failure.source}): ${failure.message}`)
        }
    })
