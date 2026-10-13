import { writeArtifactJson } from '@zoho-studio/core'

import type { ZohoModule } from '../module.types'
import { resolveMetadataSegments } from '../module.utils'

export async function saveModuleMetadata(projectPath: string, module: ZohoModule): Promise<void> {
    await writeArtifactJson(projectPath, resolveMetadataSegments(module.api_name), module)
}
