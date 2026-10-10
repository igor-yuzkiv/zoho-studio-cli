import sourceKeep from '../../../../../template/src/.gitkeep' with { type: 'file' }
import logsGitignore from '../../../../../template/logs/.gitignore' with { type: 'file' }
import settingsGitignore from '../../../../../template/.zoho-studio/.gitignore' with { type: 'file' }
import rootGitignore from '../../../../../template/.gitignore' with { type: 'file' }
import packageJson from '../../../../../template/package.json.tmpl' with { type: 'file' }
import tsconfigJson from '../../../../../template/tsconfig.json.tmpl' with { type: 'file' }
import exampleScript from '../../../../../template/scripts/example.ts.tmpl' with { type: 'file' }

import { logsDirName, workspaceSettingsDirName, workspaceSourceDirName } from '@zoho-studio/core'

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
    { embeddedPath: sourceKeep, destination: `${workspaceSourceDirName}/.gitkeep` },
    { embeddedPath: logsGitignore, destination: `${logsDirName}/.gitignore` },
    { embeddedPath: settingsGitignore, destination: `${workspaceSettingsDirName}/.gitignore` },
    { embeddedPath: rootGitignore, destination: '.gitignore' },
    { embeddedPath: packageJson, destination: 'package.json' },
    { embeddedPath: tsconfigJson, destination: 'tsconfig.json' },
    { embeddedPath: exampleScript, destination: 'scripts/example.ts' },
]
