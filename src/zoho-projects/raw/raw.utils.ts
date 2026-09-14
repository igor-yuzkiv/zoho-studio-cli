import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { resolveArtifactPath, toPathSegment, writeArtifactJson } from '@/shared/artifacts'

interface RawEntity {
    id: string
    name: string
}

/**
 * Finds the folder that already holds this entity under the parent segments — the one with
 * `<id>.json` inside — so a rerun updates the same folder even after a rename in Zoho.
 */
export async function findRawEntityDir(
    projectPath: string,
    parentSegments: string[],
    id: string
): Promise<string | null> {
    const parentPath = resolveArtifactPath(projectPath, parentSegments)
    const entries = await readdir(parentPath, { withFileTypes: true }).catch(() => [])

    for (const entry of entries) {
        if (entry.isDirectory() && (await Bun.file(join(parentPath, entry.name, `${id}.json`)).exists())) {
            return entry.name
        }
    }

    return null
}

/**
 * Writes the entity as `<folder>/<id>.json` under the parent segments and returns the folder's
 * segments. The folder is named after the entity; a name already taken by another id gets the id
 * appended, so two same-named entities never share a folder.
 */
export async function writeRawEntity(
    projectPath: string,
    parentSegments: string[],
    entity: RawEntity
): Promise<string[]> {
    const dirName =
        (await findRawEntityDir(projectPath, parentSegments, entity.id)) ??
        (await claimRawEntityDirName(projectPath, parentSegments, entity))
    const segments = [...parentSegments, dirName]

    await writeArtifactJson(projectPath, [...segments, `${entity.id}.json`], entity)

    return segments
}

async function claimRawEntityDirName(
    projectPath: string,
    parentSegments: string[],
    entity: RawEntity
): Promise<string> {
    const baseName = toPathSegment(entity.name)
    const basePath = resolveArtifactPath(projectPath, [...parentSegments, baseName])
    const taken = await readdir(basePath)
        .then((entries) => entries.length > 0)
        .catch(() => false)

    return taken ? `${baseName}.${entity.id}` : baseName
}
