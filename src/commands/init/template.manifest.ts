import sourceKeep from '../../../template/src/.gitkeep' with { type: 'file' }
import logsGitignore from '../../../template/logs/.gitignore' with { type: 'file' }
import settingsGitignore from '../../../template/.zoho-studio/.gitignore' with { type: 'file' }

import { logsDirName, projectSettingsDirName, projectSourceDirName } from '@/config'

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
 */
export const templateFiles: TemplateFile[] = [
    { embeddedPath: sourceKeep, destination: `${projectSourceDirName}/.gitkeep` },
    { embeddedPath: logsGitignore, destination: `${logsDirName}/.gitignore` },
    { embeddedPath: settingsGitignore, destination: `${projectSettingsDirName}/.gitignore` },
]
