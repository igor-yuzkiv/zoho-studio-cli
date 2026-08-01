import { mkdir, readdir, rm, unlink } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'

import { resolveProjectSourcePath } from '@/config'
import { writeJsonFile } from '@/shared/utils'

/**
 * Zoho names become path segments as they are; only characters that cannot appear in one are
 * replaced. A segment that would climb the tree or name nothing is refused rather than repaired,
 * because the caller derived it from data and would not notice a silent substitution.
 */
export function toPathSegment(value: string): string {
    const segment = value.replace(/[/\\\0]/g, '_').trim()

    if (!segment || segment === '.' || segment === '..') {
        throw new Error(`"${value}" cannot be used as a path segment.`)
    }

    return segment
}

/** Resolves a path under the project's `src`, refusing anything that would land outside it. */
export function resolveArtifactPath(projectPath: string, segments: string[]): string {
    const sourcePath = resolve(resolveProjectSourcePath(projectPath))
    const artifactPath = join(sourcePath, ...segments.map(toPathSegment))

    // Segments are sanitized above, so this holds unless that sanitizing is ever loosened.
    if (!artifactPath.startsWith(sourcePath + sep)) {
        throw new Error(`Artifact path escapes ${sourcePath}: ${artifactPath}`)
    }

    return artifactPath
}

export async function ensureArtifactDir(projectPath: string, segments: string[]): Promise<string> {
    const dirPath = resolveArtifactPath(projectPath, segments)
    await mkdir(dirPath, { recursive: true })

    return dirPath
}

/**
 * Empties a directory so it mirrors exactly what a pull returned. Destructive by design, which is
 * why it takes segments rather than a path: nothing outside `src` can be passed to it.
 */
export async function replaceArtifactDir(projectPath: string, segments: string[]): Promise<string> {
    if (segments.length === 0) {
        throw new Error('Refusing to replace the whole src directory.')
    }

    const dirPath = resolveArtifactPath(projectPath, segments)

    await rm(dirPath, { recursive: true, force: true })
    await mkdir(dirPath, { recursive: true })

    return dirPath
}

export async function writeArtifactJson(projectPath: string, segments: string[], value: unknown): Promise<void> {
    await writeJsonFile(resolveArtifactPath(projectPath, segments), value)
}

interface ModuleOwnedRecord {
    id: string
    name: string
    module?: { api_name?: string }
}

/**
 * A flat directory names files after records, so the order they are written in decides which of two
 * same-named records keeps the plain name. Fixing the order keeps that answer stable between runs.
 */
export function sortForStableFileNames<TRecord extends ModuleOwnedRecord>(records: TRecord[]): TRecord[] {
    return [...records].sort(
        (left, right) =>
            (left.module?.api_name ?? '').localeCompare(right.module?.api_name ?? '') ||
            left.name.localeCompare(right.name) ||
            left.id.localeCompare(right.id)
    )
}

/**
 * Zoho names are unique per module, not per organization, so a flat directory can collide. The
 * second claimant of a name carries the record id instead of overwriting the first one.
 */
export function resolveArtifactFileName(name: string, id: string, takenFileNames: Set<string>): string {
    const baseName = toFileBaseName(name, id)
    const fileName = `${baseName}.json`

    return takenFileNames.has(fileName) ? `${baseName}.${id}.json` : fileName
}

/**
 * Drops the records of one module from a flat directory and reports the file names left behind.
 * The owning module is read back out of each file, because the file is named after the record
 * rather than the module. A file that cannot be read as a record is left alone rather than guessed
 * about.
 */
export async function removeModuleArtifactFiles(dirPath: string, module: string): Promise<Set<string>> {
    const entries = await readdir(dirPath, { withFileTypes: true })
    const survivingFileNames = new Set<string>()

    for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.json')) {
            continue
        }

        const filePath = join(dirPath, entry.name)
        const storedRecord = await Bun.file(filePath)
            .json()
            .catch(() => null)

        if (storedRecord?.module?.api_name === module) {
            await unlink(filePath)
        } else {
            survivingFileNames.add(entry.name)
        }
    }

    return survivingFileNames
}

export async function writeArtifactText(projectPath: string, segments: string[], content: string): Promise<void> {
    const filePath = resolveArtifactPath(projectPath, segments)

    await mkdir(dirname(filePath), { recursive: true })
    await Bun.write(filePath, content)
}

function toFileBaseName(name: string, id: string): string {
    const baseName = name.replace(/[/\\\0]/g, '_').trim()

    return !baseName || baseName === '.' || baseName === '..' ? id : baseName
}
