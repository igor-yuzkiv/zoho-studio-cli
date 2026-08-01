import { Command } from 'commander'

import { modulesDirName } from '@/config'
import { getModulesList, type ZohoModule } from '@/entities/module'
import { getProjectSettings } from '@/settings'
import { replaceArtifactDir, toPathSegment, writeArtifactJson } from '@/shared/artifacts'
import { createCommandLogger } from '@/shared/logger'

export const pullModulesCommand = new Command('modules:pull')
    .description('Download the metadata of every Zoho CRM module into the project modules directory')
    .action(async () => {
        const logger = await createCommandLogger('modules:pull')
        logger.info('Starting modules pull')

        const { projectPath } = await getProjectSettings()

        let modules: ZohoModule[]

        try {
            modules = await getModulesList()
        } catch (error) {
            logger.error({ err: error }, 'Failed to fetch the modules list')
            throw error
        }

        logger.info({ total: modules.length }, 'Modules found')

        // The directory mirrors exactly what this pull returned, so stale modules are dropped.
        await replaceArtifactDir(projectPath, [modulesDirName])

        for (const module of modules) {
            await writeArtifactJson(projectPath, resolveMetadataSegments(module.api_name), module)
        }

        logger.info({ total: modules.length }, 'Modules pull finished')

        console.log(`Modules found: ${modules.length}`)
        console.log(`Metadata saved: ${modules.length}`)
    })

/** Both the directory and the file are named after the API name, which is what the fields reuse. */
export function resolveMetadataSegments(apiName: string): string[] {
    const segment = toPathSegment(apiName)

    return [modulesDirName, segment, `${segment}.metadata.json`]
}
