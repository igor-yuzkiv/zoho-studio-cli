import { loadConfig } from 'bunfig'
import { dirname, resolve } from 'node:path'

import { projectSettingsBaseName, resolveProjectSettingsDirPath, resolveProjectSettingsPath } from '@/config'
import { defaultProjectSettings } from './default.settings'
import type { ProjectSettings } from './types'

/**
 * A missing or unparseable file yields the defaults, so callers cannot use this to decide
 * whether a project is initialized.
 */
export async function loadProjectSettings(projectPath: string = process.cwd()): Promise<ProjectSettings> {
    return loadConfig<ProjectSettings>({
        name: projectSettingsBaseName,
        cwd: resolveProjectSettingsDirPath(projectPath),
        defaultConfig: defaultProjectSettings,
        // bunfig derives a SETTINGS_* env prefix from the name and applies it to the defaults,
        // so a stray ambient SETTINGS_API_BASEURL would silently replace the fallback used for
        // keys the project file omits.
        checkEnv: false,
    })
}

/** Lets commands run from a nested folder. Returns `null` when no ancestor is a project. */
export async function findProjectPath(startPath: string = process.cwd()): Promise<string | null> {
    let currentPath = resolve(startPath)

    for (;;) {
        if (await Bun.file(resolveProjectSettingsPath(currentPath)).exists()) {
            return currentPath
        }

        const parentPath = dirname(currentPath)

        // dirname() of the root returns the root itself, which is where the walk ends.
        if (parentPath === currentPath) {
            return null
        }

        currentPath = parentPath
    }
}
