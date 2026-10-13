import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { resolveWorkspaceMigrationsPath } from '@zoho-studio/core'

import { zohoCrmDirName } from '../../zoho-crm.config'

import type { MigrationDefinition } from '../definition'

import type { LoadedMigration } from './migration-loader.types'

const migrationExtension = '.ts'

function resolveCrmMigrationsPath(projectPath: string): string {
    return join(resolveWorkspaceMigrationsPath(projectPath), zohoCrmDirName)
}

/** Returns the names of the CRM migrations — file names without the extension — in name order. */
export async function listMigrations(projectPath: string): Promise<string[]> {
    const entries = await readdir(resolveCrmMigrationsPath(projectPath), { withFileTypes: true }).catch(() => [])

    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(migrationExtension))
        .map((entry) => entry.name.slice(0, -migrationExtension.length))
        .sort()
}

/** Imports a migration file; a file that cannot be used is reported as a problem rather than thrown. */
export async function loadMigration(projectPath: string, name: string): Promise<LoadedMigration> {
    const path = join(resolveCrmMigrationsPath(projectPath), `${name}${migrationExtension}`)
    let module: { default?: MigrationDefinition }

    try {
        module = await import(path)
    } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)

        return { definition: null, problem: `Migration "${name}" failed to load: ${reason}` }
    }

    if (!module.default) {
        return { definition: null, problem: `Migration "${name}" has no default export.` }
    }

    return { definition: module.default, problem: null }
}
