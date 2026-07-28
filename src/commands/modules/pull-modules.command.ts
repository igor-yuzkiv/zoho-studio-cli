import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

import { Command } from 'commander'

import { getModulesList, type ZohoModule } from '@/entities/module'
import { getProjectSettings } from '@/settings'
import { createCommandLogger } from '@/shared/logger'
import { resolveProjectDirPath, writeJsonFile } from '@/shared/utils'

export const pullModulesCommand = new Command('modules:pull')
    .description('Download the metadata of every Zoho CRM module into the project modules directory')
    .action(async () => {
        const logger = await createCommandLogger('modules:pull')
        logger.info('Starting modules pull')

        const { projectPath, settings } = await getProjectSettings()
        const modulesPath = resolveProjectDirPath(projectPath, settings.crm.modules.root_dir, 'crm.modules.root_dir')

        let modules: ZohoModule[]

        try {
            modules = await getModulesList()
        } catch (error) {
            logger.error({ err: error }, 'Failed to fetch the modules list')
            throw error
        }

        logger.info({ total: modules.length }, 'Modules found')

        // The directory mirrors exactly what this pull returned, so stale modules are dropped.
        await rm(modulesPath, { recursive: true, force: true })
        await mkdir(modulesPath, { recursive: true })

        for (const module of modules) {
            await writeJsonFile(resolveMetadataPath(modulesPath, module.api_name), module)
        }

        logger.info({ total: modules.length }, 'Modules pull finished')

        console.log(`Modules found: ${modules.length}`)
        console.log(`Metadata saved: ${modules.length}`)
    })

/** Both the directory and the file are named after the API name, which is what the fields reuse. */
export function resolveMetadataPath(modulesPath: string, apiName: string): string {
    const segment = toPathSegment(apiName)

    return join(modulesPath, segment, `${segment}.metadata.json`)
}

// Zoho names are kept as they are; only characters that cannot appear in a path segment are replaced.
function toPathSegment(value: string): string {
    return value.replace(/[/\\\0]/g, '_')
}
