import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { migrationFilePath } from '../loader'

import type { MigrationScaffold, ScaffoldedMigration } from './migration-scaffold.types'
import { buildMigrationName, buildMigrationStub } from './migration-scaffold.utils'

/** Names the file a new migration would get, without creating it. */
export function planMigrationScaffold(
    projectPath: string,
    scaffold: MigrationScaffold,
    now: Date = new Date()
): ScaffoldedMigration {
    const name = buildMigrationName(scaffold, now)

    return { name, path: migrationFilePath(projectPath, name) }
}

/**
 * Creates a migration file in `migrations/zoho-crm/` with the action filled in and no fields yet,
 * under the name the user was shown when given, or the next free one.
 */
export async function scaffoldMigration(
    projectPath: string,
    scaffold: MigrationScaffold,
    name?: string
): Promise<ScaffoldedMigration> {
    const planned = name
        ? { name, path: migrationFilePath(projectPath, name) }
        : planMigrationScaffold(projectPath, scaffold)

    await mkdir(dirname(planned.path), { recursive: true })
    await writeFile(planned.path, buildMigrationStub(scaffold), { flag: 'wx' }).catch((error: unknown) => {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
            throw new Error(`Migration "${planned.name}" already exists in "${planned.path}"; run the command again.`)
        }

        throw error
    })

    return planned
}
