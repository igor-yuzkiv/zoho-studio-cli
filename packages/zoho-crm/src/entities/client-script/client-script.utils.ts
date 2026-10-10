import { clientScriptsDirName, clientScriptsWithoutModuleDirName, zohoCrmDirName } from '../../zoho-crm.config'
import { toPathSegment } from '@zoho-studio/core'

import type { ClientScript, ClientScriptPage } from './client-script.types'

export const clientScriptPageMetadataFileName = 'page.metadata.json'

/**
 * Names the directory of every page: module label, then the definition with the layout and canvas it is
 * bound to. Two pages that would share a directory keep apart by the page id; pages are ordered by
 * id first, so which one carries the id stays the same between runs.
 */
export function resolvePageDirSegments(pages: ClientScriptPage[]): Map<string, string[]> {
    const segmentsByPageId = new Map<string, string[]>()
    const takenDirs = new Set<string>()
    const orderedPages = [...pages].sort((left, right) => left.id.localeCompare(right.id))

    for (const page of orderedPages) {
        const moduleDirName = toPathSegment(page.selectors?.module?.display_label ?? clientScriptsWithoutModuleDirName)
        const baseName = toPathSegment(resolvePageBaseName(page))
        const isTaken = takenDirs.has(`${moduleDirName}/${baseName}`)
        const pageDirName = isTaken ? `${baseName}.${page.id}` : baseName

        takenDirs.add(`${moduleDirName}/${pageDirName}`)
        segmentsByPageId.set(page.id, [zohoCrmDirName, clientScriptsDirName, moduleDirName, pageDirName])
    }

    return segmentsByPageId
}

/** Script names repeat within a page, so the directory always carries the id. */
export function resolveScriptMetadataSegments(
    pageDirSegments: string[],
    script: Pick<ClientScript, 'id' | 'name'>
): string[] {
    return [...resolveScriptDirSegments(pageDirSegments, script), `${toPathSegment(script.name)}.metadata.json`]
}

export function resolveScriptSourceSegments(
    pageDirSegments: string[],
    script: Pick<ClientScript, 'id' | 'name'>
): string[] {
    return [...resolveScriptDirSegments(pageDirSegments, script), `${toPathSegment(script.name)}.js`]
}

function resolveScriptDirSegments(pageDirSegments: string[], script: Pick<ClientScript, 'id' | 'name'>): string[] {
    return [...pageDirSegments, `${toPathSegment(script.name)}.${script.id}`]
}

function resolvePageBaseName(page: ClientScriptPage): string {
    const parts = [page.definition, page.selectors?.layout?.api_name, page.selectors?.canvas?.name]

    return parts.filter((part): part is string => Boolean(part)).join('.')
}
