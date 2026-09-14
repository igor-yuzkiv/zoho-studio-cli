import { functionCodeExtension, functionsDirName } from '@/config'
import { toPathSegment } from '@/shared/artifacts'

import type { ZohoFunction } from './function.types'

/** Only the two names are used, so the tests can exercise this without a whole Zoho payload. */
type NamedFunction = Pick<ZohoFunction, 'api_name' | 'name'>

export function resolveMetadataSegments(zohoFunction: NamedFunction): string[] {
    return [...resolveFunctionDirSegments(zohoFunction), `${toPathSegment(zohoFunction.name)}.metadata.json`]
}

export function resolveCodeSegments(zohoFunction: NamedFunction): string[] {
    return [...resolveFunctionDirSegments(zohoFunction), `${toPathSegment(zohoFunction.name)}.${functionCodeExtension}`]
}

function resolveFunctionDirSegments(zohoFunction: NamedFunction): string[] {
    return [functionsDirName, toPathSegment(zohoFunction.api_name)]
}
