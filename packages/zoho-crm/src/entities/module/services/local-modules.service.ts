import { readdir } from 'node:fs/promises'

import { assertModuleName, resolveArtifactPath } from '@zoho-studio/core'
import { modulesDirName, zohoCrmDirName } from '../../../zoho-crm.config'

/**
 * Names the local modules a per-module pull works through: the requested one, or every module
 * already pulled into `data/zoho-crm/modules/`.
 */
export async function resolveLocalModuleNames(projectPath: string, requested?: string): Promise<string[]> {
    const modulesPath = resolveArtifactPath(projectPath, [zohoCrmDirName, modulesDirName])
    const entries = await readdir(modulesPath, { withFileTypes: true }).catch(() => null)
    const moduleNames = (entries ?? [])
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()

    if (requested) {
        const moduleName = assertModuleName(requested)

        if (!moduleNames.includes(moduleName)) {
            throw new Error(
                `Module "${moduleName}" is not in "${modulesPath}". Run "zoho-studio z-crm:modules:pull" first.`
            )
        }

        return [moduleName]
    }

    if (moduleNames.length === 0) {
        throw new Error(`No modules found in "${modulesPath}". Run "zoho-studio z-crm:modules:pull" first.`)
    }

    return moduleNames
}
