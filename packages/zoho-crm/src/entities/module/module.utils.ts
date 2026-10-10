import { modulesDirName, zohoCrmDirName } from '../../zoho-crm.config'
import { toPathSegment } from '@zoho-studio/core'

/** Both the directory and the file are named after the API name, which is what the fields reuse. */
export function resolveMetadataSegments(apiName: string): string[] {
    const segment = toPathSegment(apiName)

    return [zohoCrmDirName, modulesDirName, segment, `${segment}.metadata.json`]
}
