import { getProjectSettings } from '@zoho-studio/core'
import { replaceArtifactDir } from '@zoho-studio/core'
import { createCommandLogger } from '@zoho-studio/core'
import type { PullProgress, PullResult } from '@zoho-studio/core'
import { modulesDirName, zohoCrmDirName } from '../../../zoho-crm.config'

import { getModulesListRequest } from '../api'
import type { ZohoModule } from '../module.types'
import { saveModuleMetadata } from './save-module-metadata.service'

export async function pullModules(progress: PullProgress): Promise<PullResult> {
    const logger = await createCommandLogger('z-crm:modules:pull')
    logger.info('Starting modules pull')

    const { projectPath } = await getProjectSettings()

    let modules: ZohoModule[]

    try {
        modules = await getModulesListRequest()
    } catch (error) {
        logger.error({ err: error }, 'Failed to fetch the modules list')
        throw error
    }

    logger.info({ total: modules.length }, 'Modules found')

    // The directory mirrors exactly what this pull returned, so stale modules are dropped.
    await replaceArtifactDir(projectPath, [zohoCrmDirName, modulesDirName])

    progress.start(modules.length)

    try {
        for (const module of modules) {
            progress.update(module.api_name)
            await saveModuleMetadata(projectPath, module)
            progress.increment()
        }
    } finally {
        progress.stop()
    }

    logger.info({ total: modules.length }, 'Modules pull finished')

    return {
        summary: [`Modules found: ${modules.length}`, `Metadata saved: ${modules.length}`],
        failedCount: 0,
    }
}
