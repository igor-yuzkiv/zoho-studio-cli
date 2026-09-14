import { modulesDirName } from '@/config'
import { toPathSegment } from '@/shared/artifacts'

/** Both the directory and the file are named after the API name, which is what the fields reuse. */
export function resolveMetadataSegments(apiName: string): string[] {
    const segment = toPathSegment(apiName)

    return [modulesDirName, segment, `${segment}.metadata.json`]
}
