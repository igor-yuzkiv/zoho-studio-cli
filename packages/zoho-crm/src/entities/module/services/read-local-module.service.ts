import { resolveArtifactPath } from '@zoho-studio/core'

import { moduleMetadataFilePath } from '../module.utils'
import type { ZohoModule } from '../module.types'

/** Reads a module as `z-crm:modules:pull` stored it, without asking Zoho. */
export async function readLocalModuleMetadata(projectPath: string, moduleName: string): Promise<ZohoModule> {
    const metadataPath = resolveArtifactPath(projectPath, moduleMetadataFilePath(moduleName))
    const file = Bun.file(metadataPath)

    if (!(await file.exists())) {
        throw new Error(
            `Module "${moduleName}" is not in "${metadataPath}". Run "zoho-studio z-crm:modules:pull" first.`
        )
    }

    return (await file.json()) as ZohoModule
}
