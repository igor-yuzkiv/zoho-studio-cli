import { readdir } from 'node:fs/promises'

import { getProjectSettings } from '@zoho-studio/core'
import {
    fileIdentities,
    fileIdentity,
    moveArtifactToRemoved,
    openArtifactSnapshot,
    resolveArtifactPath,
    summarizeRemovedArtifacts,
    toPathSegment,
} from '@zoho-studio/core'
import { createCommandLogger } from '@zoho-studio/core'
import type { PullProgress, PullResult } from '@zoho-studio/core'
import { modulesDirName, zohoCrmDirName } from '../../../zoho-crm.config'

import { getModulesListRequest } from '../api'
import type { ZohoModule } from '../module.types'
import { moduleMetadataFilePath } from '../module.utils'

const modulesSegments = [zohoCrmDirName, modulesDirName]

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

    // A module folder also holds the fields and layouts other pulls write, so this pull owns only
    // the metadata file of each module.
    const snapshot = await openArtifactSnapshot(projectPath, modulesSegments, {
        owns: (_record, relativePath) => relativePath.endsWith('.metadata.json'),
    })

    progress.start(modules.length)

    try {
        for (const module of modules) {
            progress.update(module.api_name)
            await snapshot.writeJson(moduleMetadataFilePath(module.api_name), module)
            progress.increment()
        }
    } finally {
        progress.stop()
    }

    const removedPaths = [
        ...(await snapshot.close()),
        ...(await moveRemovedModuleFolders(projectPath, modules)),
    ]

    logger.info({ total: modules.length, removed: removedPaths.length }, 'Modules pull finished')

    return {
        summary: [
            `Modules found: ${modules.length}`,
            `Metadata saved: ${modules.length}`,
            ...summarizeRemovedArtifacts(removedPaths),
        ],
        failedCount: 0,
        removedPaths,
    }
}

/** A module Zoho no longer has takes its whole folder along — fields and layouts included. */
async function moveRemovedModuleFolders(projectPath: string, modules: ZohoModule[]): Promise<string[]> {
    const currentFolders = new Set(modules.map((module) => toPathSegment(module.api_name)))
    const entries = await readdir(resolveArtifactPath(projectPath, modulesSegments), { withFileTypes: true }).catch(
        () => []
    )
    const currentFolderIdentities = await fileIdentities(
        [...currentFolders].map((folder) => resolveArtifactPath(projectPath, [...modulesSegments, folder]))
    )
    const moved: string[] = []

    for (const entry of entries) {
        if (!entry.isDirectory() || currentFolders.has(entry.name)) {
            continue
        }

        const folderSegments = [...modulesSegments, entry.name]
        const folderIdentity = await fileIdentity(resolveArtifactPath(projectPath, folderSegments))

        if (folderIdentity && currentFolderIdentities.has(folderIdentity)) {
            continue
        }

        moved.push(...(await moveArtifactToRemoved(projectPath, folderSegments)))
    }

    return moved
}
