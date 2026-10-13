import { replaceArtifactDir, writeArtifactJson } from '@zoho-studio/core'
import { fieldsDirName, modulesDirName, zohoCrmDirName } from '../../../zoho-crm.config'

import { resolveFieldFileName } from '../field.utils'
import type { ZohoField } from '../field.types'

/** Replaces the local fields of one module with the given ones, one file per field. */
export async function saveModuleFields(projectPath: string, moduleName: string, fields: ZohoField[]): Promise<void> {
    const fieldsSegments = [zohoCrmDirName, modulesDirName, moduleName, fieldsDirName]

    await replaceArtifactDir(projectPath, fieldsSegments)

    for (const field of fields) {
        await writeArtifactJson(projectPath, [...fieldsSegments, resolveFieldFileName(field.api_name)], field)
    }
}
