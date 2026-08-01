import { mkdir, rm } from 'node:fs/promises'
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

export async function writeArtifactText(projectPath: string, segments: string[], content: string): Promise<void> {
    const filePath = resolveArtifactPath(projectPath, segments)

    await mkdir(dirname(filePath), { recursive: true })
    await Bun.write(filePath, content)
}
