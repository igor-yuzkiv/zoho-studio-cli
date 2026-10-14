import { getProjectSettings } from '@zoho-studio/core'
import { createCommandLogger } from '@zoho-studio/core'
import type { PullProgress, PullResult } from '@zoho-studio/core'
import { delay } from '@zoho-studio/core'
import { resolveLocalModuleNames } from '../../module'

import { getLayoutsListRequest } from '../api'
import { saveModuleLayouts } from './save-module-layouts.service'

const delayBetweenModuleRequestsMs = 300

type FailedModule = {
    apiName: string
    message: string
}

export type PullLayoutsOptions = { module?: string }

export async function pullLayouts(options: PullLayoutsOptions, progress: PullProgress): Promise<PullResult> {
    const logger = await createCommandLogger('z-crm:layouts:pull')
    logger.info({ module: options.module ?? null }, 'Starting layouts pull')

    const { projectPath } = await getProjectSettings()
    const moduleNames = await resolveLocalModuleNames(projectPath, options.module)

    logger.info({ modules: moduleNames.length }, 'Local modules found')

    const failed: FailedModule[] = []
    let savedLayouts = 0
    progress.start(moduleNames.length)

    try {
        for (const [index, moduleName] of moduleNames.entries()) {
            if (index > 0) {
                await delay(delayBetweenModuleRequestsMs)
            }

            progress.update(moduleName)

            try {
                const layouts = await getLayoutsListRequest(moduleName)

                // Rewritten only once the module answered, so a failed pull keeps the previous snapshot.
                await saveModuleLayouts(projectPath, moduleName, layouts)

                savedLayouts += layouts.length
            } catch (error) {
                failed.push({
                    apiName: moduleName,
                    message: error instanceof Error ? error.message : String(error),
                })
                logger.error({ err: error, module: moduleName }, 'Failed to pull module layouts')
            }

            progress.increment()
        }
    } finally {
        progress.stop()
    }

    logger.info({ modules: moduleNames.length, layouts: savedLayouts, failed: failed.length }, 'Layouts pull finished')

    return {
        summary: [
            `Modules processed: ${moduleNames.length}`,
            `Layouts saved: ${savedLayouts}`,
            `Modules failed: ${failed.length}`,
            ...failed.map((failure) => `  - ${failure.apiName}: ${failure.message}`),
        ],
        failedCount: failed.length,
    }
}
