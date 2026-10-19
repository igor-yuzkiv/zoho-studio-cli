import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { listMigrations, migrationFilePath } from '../loader'

import type { MigrationScaffold, ScaffoldedMigration } from './migration-scaffold.types'
import { buildMigrationStub, buildNextMigrationName } from './migration-scaffold.utils'

/** Names the file a new migration would get, without creating it. */
export async function planMigrationScaffold(
    projectPath: string,
    scaffold: MigrationScaffold
): Promise<ScaffoldedMigration> {
    const name = buildNextMigrationName(await listMigrations(projectPath), scaffold)

    return { name, path: migrationFilePath(projectPath, name) }
}

/** Creates a migration file in `migrations/zoho-crm/` with the action filled in and no fields yet. */
export async function scaffoldMigration(
    projectPath: string,
    scaffold: MigrationScaffold
): Promise<ScaffoldedMigration> {
    const planned = await planMigrationScaffold(projectPath, scaffold)

    await mkdir(dirname(planned.path), { recursive: true })
    await writeFile(planned.path, buildMigrationStub(scaffold), { flag: 'wx' })

    return planned
}
