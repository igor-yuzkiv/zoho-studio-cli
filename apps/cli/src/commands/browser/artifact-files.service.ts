import { readdir, stat } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

import { resolveWorkspaceSourcePath } from '@zoho-studio/core'
import { resolveArtifactPath } from '@zoho-studio/core'

import type { FileEntry, JsonBundle } from './browser.types'

/** Paths come from the page, so each one is resolved through the same guard the pulls write through. */
export function resolveRequestedPath(projectPath: string, relativePath: string): string {
    const segments = relativePath.split('/').filter(Boolean)

    return segments.length === 0 ? resolveWorkspaceSourcePath(projectPath) : resolveArtifactPath(projectPath, segments)
}

export function toRelativePath(projectPath: string, absolutePath: string): string {
    return relative(resolveWorkspaceSourcePath(projectPath), absolutePath).split(sep).join('/')
}

export async function readFileTree(
    projectPath: string,
    relativePath: string,
    depth: number
): Promise<FileEntry | null> {
    const absolutePath = resolveRequestedPath(projectPath, relativePath)
    const stats = await stat(absolutePath).catch(() => null)

    if (!stats) {
        return null
    }

    return describeEntry(projectPath, absolutePath, depth)
}

async function describeEntry(projectPath: string, absolutePath: string, depth: number): Promise<FileEntry> {
    const stats = await stat(absolutePath)
    const entry: FileEntry = {
        name: absolutePath.split(sep).pop() ?? '',
        path: toRelativePath(projectPath, absolutePath),
        absolutePath,
        kind: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modifiedAt: stats.mtime.toISOString(),
    }

    if (entry.kind === 'directory' && depth > 0) {
        const names = (await readdir(absolutePath)).filter((name) => !name.startsWith('.')).sort()
        entry.children = await Promise.all(
            names.map((name) => describeEntry(projectPath, join(absolutePath, name), depth - 1))
        )
    }

    return entry
}

export async function readJsonBundle(projectPath: string, relativePath: string): Promise<JsonBundle> {
    const rootPath = resolveRequestedPath(projectPath, relativePath)
    const bundle: JsonBundle = {}
    const glob = new Bun.Glob('**/*.json')

    for await (const filePath of glob.scan({ cwd: rootPath, onlyFiles: true })) {
        const absolutePath = join(rootPath, filePath)
        bundle[toRelativePath(projectPath, absolutePath)] = await Bun.file(absolutePath)
            .json()
            .catch(() => null)
    }

    return bundle
}
