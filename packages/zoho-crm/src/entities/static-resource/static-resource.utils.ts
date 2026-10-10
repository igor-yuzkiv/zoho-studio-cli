import { staticResourcesDirName, zohoCrmDirName } from '../../zoho-crm.config'
import { toPathSegment } from '@zoho-studio/core'

import type { StaticResource } from './static-resource.types'

type LocatedResource = Pick<StaticResource, 'id' | 'name' | 'file_name' | 'source'>

export function resolveMetadataSegments(resource: LocatedResource): string[] {
    return [...resolveResourceDirSegments(resource), `${toPathSegment(resource.name)}.metadata.json`]
}

export function resolveContentSegments(resource: LocatedResource): string[] {
    return [...resolveResourceDirSegments(resource), toPathSegment(resource.file_name)]
}

/** Resources are split by who owns them — `user`, `crm`, `internal` — and carry the id, as names may repeat. */
function resolveResourceDirSegments(resource: LocatedResource): string[] {
    return [
        zohoCrmDirName,
        staticResourcesDirName,
        toPathSegment(resource.source),
        `${toPathSegment(resource.name)}.${resource.id}`,
    ]
}
