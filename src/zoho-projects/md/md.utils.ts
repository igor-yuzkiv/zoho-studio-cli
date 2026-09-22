import { mkdir, readdir, rm } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'

import { stringify } from 'yaml'

import type { ProjectSettings } from '@/settings'
import { toPathSegment } from '@/shared/artifacts'

export type ProjectRef = Pick<ProjectSettings['projects'], 'portalId' | 'projectId'>

const namedEntities: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
}

/** Zoho double-encodes names on the way in (`&amp;amp;`), so decoding repeats until nothing changes. */
export function decodeHtmlEntities(text: string): string {
    const decoded = text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
        if (code.startsWith('#x') || code.startsWith('#X')) {
            return String.fromCodePoint(Number.parseInt(code.slice(2), 16))
        }

        if (code.startsWith('#')) {
            return String.fromCodePoint(Number.parseInt(code.slice(1), 10))
        }

        return namedEntities[code.toLowerCase()] ?? entity
    })

    return decoded === text ? decoded : decodeHtmlEntities(decoded)
}

/** A Zoho name as the catalogue shows it: entities decoded, surrounding whitespace gone. */
export function cleanName(name: string): string {
    return decodeHtmlEntities(name).trim()
}

const slugMaxLength = 80

/**
 * Lower-case, everything but letters and digits collapsed to one dash, cut to 80 characters — the
 * Obsidian folder and file names. The fixed `_no-*` folders keep their underscore; a name with no
 * letters or digits at all falls back to the given id.
 */
export function toSlug(name: string, fallback = ''): string {
    if (name.startsWith('_')) {
        return name
    }

    const slug = cleanName(name)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-|-$/g, '')
        .slice(0, slugMaxLength)
        .replace(/-$/, '')

    return slug || fallback
}

/** `:`, `|`, `/`, `\`, `[`, `]` become ` -`; wikilinks point at this name, so it is never cut. */
export function toDisplayName(name: string): string {
    return cleanName(name)
        .replace(/[:|/\\[\]]/g, ' -')
        .replace(/\s+/g, ' ')
        .trim()
}

export function renderFrontmatter(fields: Record<string, unknown>): string {
    return `---\n${stringify(fields, { indentSeq: false, lineWidth: 0, singleQuote: true }).trimEnd()}\n---`
}

/** `bug-detail` is Zoho's fragment for an issue — the product renamed bugs to issues, the URLs did not. */
type ZohoEntityKind = 'task-detail' | 'tasklist-detail' | 'milestone-detail' | 'bug-detail'

export function zohoProjectsUrl(projects: ProjectRef, kind: ZohoEntityKind, id: string): string {
    return `https://projects.zoho.com/portal/${projects.portalId}#zp/projects/${projects.projectId}/${kind}/${id}`
}

/** The catalogue folder: `src/zoho-projects/md` inside the workspace unless `projects.mdPath` names another one. */
export function resolveMdPath(projectPath: string, mdPath: string): string {
    const workspacePath = resolve(projectPath)

    return mdPath.trim() ? resolve(workspacePath, mdPath.trim()) : join(workspacePath, 'src', 'zoho-projects', 'md')
}

/** Writes one catalogue file below the md folder; every segment is sanitized so a Zoho name cannot leave it. */
export async function writeMdFile(mdPath: string, segments: string[], content: string): Promise<void> {
    const filePath = join(mdPath, ...segments.map(toPathSegment))

    if (!filePath.startsWith(mdPath + sep)) {
        throw new Error(`Catalogue path escapes ${mdPath}: ${filePath}`)
    }

    await mkdir(dirname(filePath), { recursive: true })
    await Bun.write(filePath, content)
}

/**
 * A task changes folder when its status changes; the copy under the previous status of the same
 * task list is removed so the vault does not show the task twice. Nothing else is ever deleted.
 */
export async function removeTaskFileFromOtherStatuses(mdPath: string, taskSegments: string[]): Promise<void> {
    const [milestoneDir, taskListDir, statusDir, fileName] = taskSegments.map(toPathSegment)
    const taskListPath = join(mdPath, milestoneDir!, taskListDir!)
    const entries = await readdir(taskListPath, { withFileTypes: true }).catch(() => [])

    for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== statusDir) {
            await rm(join(taskListPath, entry.name, fileName!), { force: true })
        }
    }
}
