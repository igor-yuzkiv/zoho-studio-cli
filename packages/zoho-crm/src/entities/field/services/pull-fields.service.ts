import { getProjectSettings } from '@zoho-studio/core'
import { createCommandLogger } from '@zoho-studio/core'
import type { PullProgress, PullResult } from '@zoho-studio/core'
import { delay } from '@zoho-studio/core'
import { resolveLocalModuleNames } from '../../module'

import { getFieldsListRequest } from '../api'
import { saveModuleFields } from './save-module-fields.service'

const delayBetweenModuleRequestsMs = 300

type FailedModule = {
    apiName: string
    message: string
}

export type PullFieldsOptions = { module?: string }

export async function pullFields(options: PullFieldsOptions, progress: PullProgress): Promise<PullResult> {
    const logger = await createCommandLogger('z-crm:fields:pull')
    logger.info({ module: options.module ?? null }, 'Starting fields pull')

    const { projectPath } = await getProjectSettings()
    const moduleNames = await resolveLocalModuleNames(projectPath, options.module)

    logger.info({ modules: moduleNames.length }, 'Local modules found')

    const failed: FailedModule[] = []
    let savedFields = 0
    progress.start(moduleNames.length)

    try {
        for (const [index, moduleName] of moduleNames.entries()) {
            if (index > 0) {
                await delay(delayBetweenModuleRequestsMs)
            }

            progress.update(moduleName)

            try {
                const fields = await getFieldsListRequest(moduleName)

                // Rewritten only once the module answered, so a failed pull keeps the previous snapshot.
                await saveModuleFields(projectPath, moduleName, fields)

                savedFields += fields.length
            } catch (error) {
                failed.push({
                    apiName: moduleName,
                    message: error instanceof Error ? error.message : String(error),
                })
                logger.error({ err: error, module: moduleName }, 'Failed to pull module fields')
            }

            progress.increment()
        }
    } finally {
        progress.stop()
    }

    logger.info({ modules: moduleNames.length, fields: savedFields, failed: failed.length }, 'Fields pull finished')

    return {
        summary: [
            `Modules processed: ${moduleNames.length}`,
            `Fields saved: ${savedFields}`,
            `Modules failed: ${failed.length}`,
            ...failed.map((failure) => `  - ${failure.apiName}: ${failure.message}`),
        ],
        failedCount: failed.length,
    }
}
