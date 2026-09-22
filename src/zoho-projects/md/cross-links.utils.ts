import { cleanName } from './md.utils'

export interface CrossLinkTarget {
    id: string
    prefix: string | null
    name: string
    status: string | null
    /** The catalogue file name without `.md`; wikilinks point at it. */
    fileBaseName: string
}

/** One kind of entity a text can mention: tasks or issues, each with its own prefix letter and URL fragment. */
export interface CrossLinkSource {
    /** `task` or `issue` — the word in front of an id-only mention. */
    label: string
    /** `T` for tasks, `I` for issues — the letter between the project key and the number (`SS5-T580`, `SS5-I14`). */
    prefixLetter: string
    /** The URL fragment Zoho puts in front of the id (`task-detail`, `bug-detail`). */
    urlKind: string
    targets: CrossLinkTarget[]
}

export interface CrossLink {
    line: string
    /** Set when the target is in `raw/`; null for a mention that could not be resolved. */
    target: CrossLinkTarget | null
}

export interface CrossLinkDependency {
    relation: string
    id: string
}

/**
 * Explicit dependencies first, then every entity mentioned by id or prefix in the texts, each once.
 * The project key (`SS5-`) comes from the entity's own prefix, so mentions of other projects stay text.
 */
export function resolveCrossLinks(
    self: { id: string; prefix?: string },
    texts: string[],
    dependencies: CrossLinkDependency[],
    sources: CrossLinkSource[]
): CrossLink[] {
    const links = new Map<string, CrossLink>()
    const projectKey = self.prefix?.match(/^(.*?)[A-Za-z]\d+$/)?.[1]
    const text = texts.join('\n')

    const add = (key: string, found: CrossLinkTarget | undefined, fallbackLabel: string, relation?: string): void => {
        if (key === self.id || key === self.prefix || links.has(key)) {
            return
        }

        if (!found) {
            links.set(key, { line: `${fallbackLabel} — not pulled`, target: null })
            return
        }

        const label = found.prefix ?? found.id
        const detail = relation ? `(${relation})` : `${cleanName(found.name)} (${found.status ?? 'Unknown'})`

        links.set(key, { line: `[[${found.fileBaseName}]] — ${label} ${detail}`, target: found })
    }

    const byId = new Map<string, CrossLinkTarget>()

    for (const source of sources) {
        for (const target of source.targets) {
            byId.set(target.id, target)
        }
    }

    for (const { relation, id } of dependencies) {
        add(id, byId.get(id), `${sources[0]?.label ?? 'entity'} ${id}`, relation)
    }

    for (const source of sources) {
        const byPrefix = new Map(source.targets.flatMap((target) => (target.prefix ? [[target.prefix, target]] : [])))

        // An id-only mention has no readable label, so it is listed only when the entity is in raw/.
        for (const [, id] of text.matchAll(new RegExp(`${source.urlKind}/(\\d+)`, 'g'))) {
            const found = byId.get(id!)

            if (found && source.targets.includes(found)) {
                add(id!, found, `${source.label} ${id}`)
            }
        }

        if (projectKey !== undefined) {
            const escaped = `${projectKey}${source.prefixLetter}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

            for (const [, prefix] of text.matchAll(new RegExp(`\\b(${escaped}\\d+)\\b`, 'g'))) {
                const found = byPrefix.get(prefix!)

                add(found?.id ?? prefix!, found, prefix!)
            }
        }
    }

    return [...links.values()]
}
