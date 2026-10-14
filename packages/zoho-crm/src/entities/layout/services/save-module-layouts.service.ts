import { replaceArtifactDir, resolveArtifactFileName, writeArtifactJson } from '@zoho-studio/core'
import { layoutsDirName, modulesDirName, zohoCrmDirName } from '../../../zoho-crm.config'

import type { ZohoLayout } from '../layout.types'

/** Replaces the local layouts of one module with the given ones, one file per layout. */
export async function saveModuleLayouts(projectPath: string, moduleName: string, layouts: ZohoLayout[]): Promise<void> {
    const layoutsSegments = [zohoCrmDirName, modulesDirName, moduleName, layoutsDirName]
    const takenFileNames = new Set<string>()

    await replaceArtifactDir(projectPath, layoutsSegments)

    for (const layout of layouts) {
        const fileName = resolveArtifactFileName(layout.api_name, layout.id, takenFileNames)

        await writeArtifactJson(projectPath, [...layoutsSegments, fileName], layout)
        takenFileNames.add(fileName)
    }
}
