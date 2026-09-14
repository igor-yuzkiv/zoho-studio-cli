import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { resolveArtifactPath, toPathSegment, writeArtifactJson } from '@/shared/artifacts'

export interface RawEntity {
    id: string
    name: string
}

/**
 * Finds the folder that already holds this entity under the parent segments — the one with
 * `<id>.json` inside — so a rerun updates the same folder even after a rename in Zoho.
 */
export async function findRawEntitySegments(
    projectPath: string,
    parentSegments: string[],
    id: string
): Promise<string[] | null> {
    const parentPath = resolveArtifactPath(projectPath, parentSegments)
    const entries = await readdir(parentPath, { withFileTypes: true }).catch(() => [])

    for (const entry of entries) {
        if (entry.isDirectory() && (await Bun.file(join(parentPath, entry.name, `${id}.json`)).exists())) {
            return [...parentSegments, entry.name]
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
    const segments = (await findRawEntitySegments(projectPath, parentSegments, entity.id)) ?? [
        ...parentSegments,
        await claimRawEntityDirName(projectPath, parentSegments, entity),
    ]

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

interface RawEntityResolverSource<Entity extends RawEntity> {
    entityName: string
    fetchList: () => Promise<Entity[]>
    findLocal: (id: string) => Promise<string[] | null>
    write: (entity: Entity) => Promise<string[]>
}

/**
 * Resolves an entity's folder for the pull commands that need a parent: local first, otherwise
 * from the list fetched once per run and written on the way. Each id is resolved once.
 */
export class RawEntityResolver<Entity extends RawEntity> {
    private remoteEntities: Promise<Map<string, Entity>> | null = null
    private readonly segmentsById = new Map<string, Promise<string[]>>()

    constructor(private readonly source: RawEntityResolverSource<Entity>) {}

    resolveSegments(id: string): Promise<string[]> {
        let segments = this.segmentsById.get(id)

        if (!segments) {
            segments = this.resolveUncached(id)
            this.segmentsById.set(id, segments)
        }

        return segments
    }

    private async resolveUncached(id: string): Promise<string[]> {
        const local = await this.source.findLocal(id)

        if (local) {
            return local
        }

        const entity = (await this.fetchRemoteEntities()).get(id)

        if (!entity) {
            throw new Error(`${this.source.entityName} "${id}" is not in the project.`)
        }

        return this.source.write(entity)
    }

    private fetchRemoteEntities(): Promise<Map<string, Entity>> {
        this.remoteEntities ??= this.source
            .fetchList()
            .then((entities) => new Map(entities.map((entity) => [entity.id, entity])))

        return this.remoteEntities
    }
}

export interface SkippedEntity {
    id: string
    name: string
    message: string
}

/** Prints the skipped entities of a pull and makes the exit code non-zero when there are any. */
export function reportSkipped(label: string, skipped: SkippedEntity[]): void {
    console.log(`${label} skipped: ${skipped.length}`)

    for (const entity of skipped) {
        console.log(`  - ${entity.name} (${entity.id}): ${entity.message}`)
    }

    if (skipped.length > 0) {
        process.exitCode = 1
    }
}
