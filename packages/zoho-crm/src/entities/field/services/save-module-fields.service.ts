import { openArtifactSnapshot } from '@zoho-studio/core'
import { fieldsDirName, modulesDirName, zohoCrmDirName } from '../../../zoho-crm.config'

import { resolveFieldFileName } from '../field.utils'
import type { ZohoField } from '../field.types'

/**
 * Mirrors the given fields of one module, one file per field, and returns the paths of the fields
 * it moved to `data/.removed/` because Zoho no longer has them.
 */
export async function saveModuleFields(projectPath: string, moduleName: string, fields: ZohoField[]): Promise<string[]> {
    const fieldsSegments = [zohoCrmDirName, modulesDirName, moduleName, fieldsDirName]
    const snapshot = await openArtifactSnapshot(projectPath, fieldsSegments)

    for (const field of fields) {
        await snapshot.writeJson([...fieldsSegments, resolveFieldFileName(field.api_name)], field)
    }

    return snapshot.close()
}
