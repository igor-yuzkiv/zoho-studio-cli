import { mkdir, readdir, rename, rm, rmdir, stat } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'

import { resolveWorkspaceDataPath } from '../config'
import { resolveArtifactPath } from './artifacts.service'

export const removedArtifactsDirName = '.removed'

export interface ArtifactSnapshotOptions {
    /**
     * Whether an existing file belongs to this pull, judged by its parsed JSON (`null` for a file
     * that is not JSON). A file it does not own is never moved — a single-module pull owns only
     * that module's records. Without it the pull owns every file under the folder.
     */
    owns?: (record: unknown, relativePath: string) => boolean
}

/**
 * A pull's view of the folder it mirrors: it writes through the snapshot, and closing it moves the
 * files the pull owned but did not write — what Zoho no longer has — into `data/.removed/`.
 */
export interface ArtifactSnapshot {
    writeJson(segments: string[], value: unknown): Promise<void>
    writeText(segments: string[], content: string): Promise<void>
    writeBytes(segments: string[], content: Uint8Array): Promise<void>
    /**
     * Keeps an existing file — or every file under a folder — as it is, for an item Zoho still has
     * but whose content could not be fetched this time.
     */
    keep(segments: string[]): void
    /** Names of the files directly in the folder that the pull does not own. */
    readonly keptFileNames: Set<string>
    /** Moves what was not written and returns the moved paths, relative to `data/`. */
    close(): Promise<string[]>
}

let removedStamp: string | undefined

/**
 * One folder per process, so the steps of a preset put everything they moved side by side.
 * The stamp is in UTC and has no colons, which some file systems refuse.
 */
function removedRunSegment(): string {
    removedStamp ??= new Date().toISOString().slice(0, 19).replace(/:/g, '-')

    return removedStamp
}

export async function openArtifactSnapshot(
    projectPath: string,
    segments: string[],
    options: ArtifactSnapshotOptions = {}
): Promise<ArtifactSnapshot> {
    if (segments.length === 0) {
        throw new Error('Refusing to snapshot the whole data directory.')
    }

    const dirPath = resolveArtifactPath(projectPath, segments)
    const ownedFilePaths = new Set<string>()
    const keptFileNames = new Set<string>()

    for (const filePath of await listFilesUnder(dirPath)) {
        const relativePath = relative(dirPath, filePath)
        const owned = options.owns ? options.owns(await readJsonOrNull(filePath), relativePath) : true

        if (owned) {
            ownedFilePaths.add(filePath)
        } else if (!relativePath.includes(sep)) {
            keptFileNames.add(relativePath)
        }
    }

    const writtenFilePaths = new Set<string>()
    const keptPaths = new Set<string>()
    const isKept = (filePath: string) =>
        [...keptPaths].some((keptPath) => filePath === keptPath || filePath.startsWith(keptPath + sep))

    async function write(fileSegments: string[], content: string | Uint8Array): Promise<void> {
        const filePath = resolveArtifactPath(projectPath, fileSegments)
        writtenFilePaths.add(filePath)

        if (await hasContent(filePath, content)) {
            return
        }

        await mkdir(dirname(filePath), { recursive: true })
        await Bun.write(filePath, content)
    }

    return {
        writeJson: (fileSegments, value) => write(fileSegments, `${JSON.stringify(value, null, 4)}\n`),
        writeText: (fileSegments, content) => write(fileSegments, content),
        writeBytes: (fileSegments, content) => write(fileSegments, content),
        keep: (fileSegments) => {
            keptPaths.add(resolveArtifactPath(projectPath, fileSegments))
        },
        keptFileNames,
        async close() {
            const moved: string[] = []
            const writtenIdentities = await fileIdentities([...writtenFilePaths])

            for (const filePath of ownedFilePaths) {
                if (
                    writtenFilePaths.has(filePath) ||
                    isKept(filePath) ||
                    writtenIdentities.has((await fileIdentity(filePath)) ?? '')
                ) {
                    continue
                }

                moved.push(await moveFileToRemoved(projectPath, filePath))
            }

            await removeEmptyDirs(dirPath)

            return moved
        },
    }
}

/** Moves a whole folder or file into `data/.removed/` and returns the moved file paths, relative to `data/`. */
export async function moveArtifactToRemoved(projectPath: string, segments: string[]): Promise<string[]> {
    const targetPath = resolveArtifactPath(projectPath, segments)
    const moved: string[] = []

    for (const filePath of await listFilesUnder(targetPath)) {
        moved.push(await moveFileToRemoved(projectPath, filePath))
    }

    await rm(targetPath, { recursive: true, force: true })

    return moved
}

async function moveFileToRemoved(projectPath: string, filePath: string): Promise<string> {
    const dataPath = resolveWorkspaceDataPath(projectPath)
    const removedRelativePath = join(removedArtifactsDirName, removedRunSegment(), relative(dataPath, filePath))
    const removedPath = join(dataPath, removedRelativePath)

    await mkdir(dirname(removedPath), { recursive: true })
    await rename(filePath, removedPath)

    return removedRelativePath.split(sep).join('/')
}

/**
 * Which file on disk a path names. On a case-insensitive file system (macOS by default) `Foo.json`
 * and `foo.json` are one file, so a renamed item's new path must not count the old one as removed.
 */
export async function fileIdentity(path: string): Promise<string | null> {
    const stats = await stat(path).catch(() => null)

    return stats ? `${stats.dev}:${stats.ino}` : null
}

export async function fileIdentities(paths: string[]): Promise<Set<string>> {
    const identities = await Promise.all(paths.map(fileIdentity))

    return new Set(identities.filter((identity): identity is string => identity !== null))
}

async function listFilesUnder(dirPath: string): Promise<string[]> {
    const entries = await readdir(dirPath, { recursive: true, withFileTypes: true }).catch(() => [])

    return entries.filter((entry) => entry.isFile()).map((entry) => join(entry.parentPath, entry.name))
}

async function readJsonOrNull(filePath: string): Promise<unknown> {
    if (!filePath.endsWith('.json')) {
        return null
    }

    return Bun.file(filePath)
        .json()
        .catch(() => null)
}

async function hasContent(filePath: string, content: string | Uint8Array): Promise<boolean> {
    const file = Bun.file(filePath)

    if (!(await file.exists())) {
        return false
    }

    const expected = typeof content === 'string' ? new TextEncoder().encode(content) : content
    const actual = new Uint8Array(await file.arrayBuffer())

    return actual.length === expected.length && actual.every((byte, index) => byte === expected[index])
}

/** Removes the folders under `dirPath` that a move left empty, keeping `dirPath` itself. */
async function removeEmptyDirs(dirPath: string): Promise<void> {
    const entries = await readdir(dirPath, { withFileTypes: true }).catch(() => [])

    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue
        }

        const childPath = join(dirPath, entry.name)
        await removeEmptyDirs(childPath)

        if ((await readdir(childPath)).length === 0) {
            await rmdir(childPath)
        }
    }
}

/** The summary line a pull prints for what it moved, or nothing when it moved nothing. */
export function summarizeRemovedArtifacts(removedPaths: string[]): string[] {
    const runFolder = removedPaths[0]?.split('/').slice(0, 2).join('/')

    return runFolder ? [`Moved ${removedPaths.length} removed files to data/${runFolder}/`] : []
}
