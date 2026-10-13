import { writeArtifactJson } from '@zoho-studio/core'

import type { ZohoModule } from '../module.types'
import { moduleMetadataFilePath } from '../module.utils'

export async function saveModuleMetadata(projectPath: string, module: ZohoModule): Promise<void> {
    await writeArtifactJson(projectPath, moduleMetadataFilePath(module.api_name), module)
}
