import { openArtifactSnapshot, resolveArtifactFileName } from '@zoho-studio/core'
import { layoutsDirName, modulesDirName, zohoCrmDirName } from '../../../zoho-crm.config'

import type { ZohoLayout } from '../layout.types'

/**
 * Mirrors the given layouts of one module, one file per layout, and returns the paths of the
 * layouts it moved to `data/.removed/` because Zoho no longer has them.
 */
export async function saveModuleLayouts(
    projectPath: string,
    moduleName: string,
    layouts: ZohoLayout[]
): Promise<string[]> {
    const layoutsSegments = [zohoCrmDirName, modulesDirName, moduleName, layoutsDirName]
    const takenFileNames = new Set<string>()
    const snapshot = await openArtifactSnapshot(projectPath, layoutsSegments)

    for (const layout of layouts) {
        const fileName = resolveArtifactFileName(layout.api_name, layout.id, takenFileNames)

        await snapshot.writeJson([...layoutsSegments, fileName], layout)
        takenFileNames.add(fileName)
    }

    return snapshot.close()
}
