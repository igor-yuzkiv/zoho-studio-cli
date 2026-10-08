import { readdir } from 'node:fs/promises'

import { getProjectSettings } from '@/settings'
import { replaceArtifactDir, resolveArtifactPath, writeArtifactJson } from '@/shared/artifacts'
import { createCommandLogger } from '@/shared/logger'
import type { PullProgress, PullResult } from '@/shared/pull'
import { assertModuleName, delay } from '@/shared/utils'
import { fieldsDirName, modulesDirName, zohoCrmDirName } from '@/zoho-crm/zoho-crm.config'

import { getFieldsList } from '../api'
import { resolveFieldFileName } from '../field.utils'

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
    const modulesPath = resolveArtifactPath(projectPath, [zohoCrmDirName, modulesDirName])

    const moduleNames = options.module
        ? [await resolveRequestedModule(modulesPath, options.module)]
        : await readLocalModuleNames(modulesPath)

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
                const fields = await getFieldsList(moduleName)
                const fieldsSegments = [zohoCrmDirName, modulesDirName, moduleName, fieldsDirName]

                // Rewritten only once the module answered, so a failed pull keeps the previous snapshot.
                await replaceArtifactDir(projectPath, fieldsSegments)

                for (const field of fields) {
                    await writeArtifactJson(
                        projectPath,
                        [...fieldsSegments, resolveFieldFileName(field.api_name)],
                        field
                    )
                }

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

async function readLocalModuleNames(modulesPath: string): Promise<string[]> {
    const entries = await readdir(modulesPath, { withFileTypes: true }).catch(() => null)
    const moduleNames = (entries ?? [])
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()

    if (moduleNames.length === 0) {
        throw new Error(`No modules found in "${modulesPath}". Run "zoho-studio z-crm:modules:pull" first.`)
    }

    return moduleNames
}

async function resolveRequestedModule(modulesPath: string, requested: string): Promise<string> {
    const moduleName = assertModuleName(requested)
    const entries = await readdir(modulesPath, { withFileTypes: true }).catch(() => null)
    const exists = (entries ?? []).some((entry) => entry.isDirectory() && entry.name === moduleName)

    if (!exists) {
        throw new Error(
            `Module "${moduleName}" is not in "${modulesPath}". Run "zoho-studio z-crm:modules:pull" first.`
        )
    }

    return moduleName
}
