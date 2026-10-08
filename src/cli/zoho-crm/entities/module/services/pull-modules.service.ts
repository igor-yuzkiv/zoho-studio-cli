import { getProjectSettings } from '@/settings'
import { replaceArtifactDir, writeArtifactJson } from '@/shared/artifacts'
import { createCommandLogger } from '@/shared/logger'
import type { PullProgress, PullResult } from '@/shared/pull'
import { modulesDirName, zohoCrmDirName } from '@/zoho-crm/zoho-crm.config'

import { getModulesList } from '../api'
import type { ZohoModule } from '../module.types'
import { resolveMetadataSegments } from '../module.utils'

export async function pullModules(progress: PullProgress): Promise<PullResult> {
    const logger = await createCommandLogger('z-crm:modules:pull')
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
    await replaceArtifactDir(projectPath, [zohoCrmDirName, modulesDirName])

    progress.start(modules.length)

    try {
        for (const module of modules) {
            progress.update(module.api_name)
            await writeArtifactJson(projectPath, resolveMetadataSegments(module.api_name), module)
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
