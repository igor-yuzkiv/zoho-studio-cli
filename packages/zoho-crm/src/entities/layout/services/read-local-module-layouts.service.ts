import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { resolveArtifactPath } from '@zoho-studio/core'
import { layoutsDirName, modulesDirName, zohoCrmDirName } from '../../../zoho-crm.config'

import type { ZohoLayout } from '../layout.types'

/** Reads the layouts of one module as `z-crm:layouts:pull` stored them, ordered by file name. */
export async function readLocalModuleLayouts(projectPath: string, moduleName: string): Promise<ZohoLayout[]> {
    const layoutsPath = resolveArtifactPath(projectPath, [zohoCrmDirName, modulesDirName, moduleName, layoutsDirName])
    const fileNames = await readdir(layoutsPath).catch(() => null)

    if (!fileNames) {
        throw new Error(
            `Layouts of "${moduleName}" are not in "${layoutsPath}". Run "zoho-studio z-crm:layouts:pull --module=${moduleName}" first.`
        )
    }

    const layouts: ZohoLayout[] = []

    for (const fileName of fileNames.filter((name) => name.endsWith('.json')).sort()) {
        layouts.push((await Bun.file(join(layoutsPath, fileName)).json()) as ZohoLayout)
    }

    return layouts
}
