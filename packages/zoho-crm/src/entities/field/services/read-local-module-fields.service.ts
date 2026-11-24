import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { resolveArtifactPath } from '@zoho-studio/core'
import { fieldsDirName, modulesDirName, zohoCrmDirName } from '../../../zoho-crm.config'

import type { ZohoField } from '../field.types'

/** Reads the fields of one module as `z-crm:fields:pull` stored them, ordered by API name. */
export async function readLocalModuleFields(projectPath: string, moduleName: string): Promise<ZohoField[]> {
    const fieldsPath = resolveArtifactPath(projectPath, [zohoCrmDirName, modulesDirName, moduleName, fieldsDirName])
    const fileNames = await readdir(fieldsPath).catch(() => null)

    if (!fileNames) {
        throw new Error(
            `Fields of "${moduleName}" are not in "${fieldsPath}". Run "zoho-studio z-crm:fields:pull --module=${moduleName}" first.`
        )
    }

    const fields: ZohoField[] = []

    for (const fileName of fileNames.filter((name) => name.endsWith('.json')).sort()) {
        fields.push((await Bun.file(join(fieldsPath, fileName)).json()) as ZohoField)
    }

    return fields
}
