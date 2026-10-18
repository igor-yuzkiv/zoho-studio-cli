import dataKeep from '../../../../../template/data/.gitkeep' with { type: 'file' }
import functionsSourceKeep from '../../../../../template/src/zoho-crm/functions/.gitkeep' with { type: 'file' }
import logsGitignore from '../../../../../template/logs/.gitignore' with { type: 'file' }
import settingsGitignore from '../../../../../template/.zoho-studio/.gitignore' with { type: 'file' }
import rootGitignore from '../../../../../template/.gitignore' with { type: 'file' }
import packageJson from '../../../../../template/package.json.tmpl' with { type: 'file' }
import tsconfigJson from '../../../../../template/tsconfig.json.tmpl' with { type: 'file' }
import exampleScript from '../../../../../template/scripts/example.ts.tmpl' with { type: 'file' }
import migrateScript from '../../../../../template/scripts/migrate.ts.tmpl' with { type: 'file' }
import exampleMigration from '../../../../../template/scripts/example-migration.ts.txt' with { type: 'file' }
import migrationsKeep from '../../../../../template/migrations/zoho-crm/.gitkeep' with { type: 'file' }

import {
    logsDirName,
    migrationsDirName,
    workspaceDataDirName,
    workspaceSettingsDirName,
    workspaceSourceDirName,
} from '@zoho-studio/core'
import { functionsDirName, zohoCrmDirName } from '@zoho-studio/zoho-crm'

export interface TemplateFile {
    /** Where the file is on disk, or inside the compiled executable. */
    embeddedPath: string
    /** Where it lands in the project, relative to its root. */
    destination: string
}

/**
 * `bun build --compile` rewrites an embedded file's name to a hash, so the destination cannot be
 * derived from the source path and is spelled out here. A file added to `template/` without an
 * entry never reaches the user, which `template.manifest.spec.ts` is there to catch.
 *
 * A template file TypeScript would otherwise treat as a module (`.json`, `.ts`) carries the
 * `.tmpl` suffix in `template/` and loses it here, so `tsc` leaves the file alone.
 */
export const templateSourceSuffix = '.tmpl'

export const templateFiles: TemplateFile[] = [
    { embeddedPath: dataKeep, destination: `${workspaceDataDirName}/.gitkeep` },
    {
        embeddedPath: functionsSourceKeep,
        destination: `${workspaceSourceDirName}/${zohoCrmDirName}/${functionsDirName}/.gitkeep`,
    },
    { embeddedPath: logsGitignore, destination: `${logsDirName}/.gitignore` },
    { embeddedPath: settingsGitignore, destination: `${workspaceSettingsDirName}/.gitignore` },
    { embeddedPath: rootGitignore, destination: '.gitignore' },
    { embeddedPath: packageJson, destination: 'package.json' },
    { embeddedPath: tsconfigJson, destination: 'tsconfig.json' },
    { embeddedPath: exampleScript, destination: 'scripts/example.ts' },
    { embeddedPath: migrateScript, destination: 'scripts/migrate.ts' },
    { embeddedPath: exampleMigration, destination: 'scripts/example-migration.ts.txt' },
    { embeddedPath: migrationsKeep, destination: `${migrationsDirName}/${zohoCrmDirName}/.gitkeep` },
]
