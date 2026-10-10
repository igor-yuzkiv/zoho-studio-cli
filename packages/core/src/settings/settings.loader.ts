import { loadConfig } from 'bunfig'
import { dirname, resolve } from 'node:path'

import { workspaceSettingsBaseName, resolveWorkspaceSettingsDirPath, resolveWorkspaceSettingsPath } from '../config'
import { defaultProjectSettings } from './default.settings'
import type { AuthScopes, ProjectSettings } from './types'

/**
 * A missing or unparseable file yields the defaults, so callers cannot use this to decide
 * whether a project is initialized.
 */
export async function loadProjectSettings(projectPath: string = process.cwd()): Promise<ProjectSettings> {
    const settings = await loadConfig<ProjectSettings>({
        name: workspaceSettingsBaseName,
        cwd: resolveWorkspaceSettingsDirPath(projectPath),
        defaultConfig: defaultProjectSettings,
        // bunfig derives a SETTINGS_* env prefix from the name and applies it to the defaults,
        // so a stray ambient SETTINGS_API_BASEURL would silently replace the fallback used for
        // keys the project file omits.
        checkEnv: false,
    })

    return { ...settings, auth: { ...settings.auth, scopes: normalizeScopes(settings.auth.scopes) } }
}

/** Files written before the scopes were split per product hold one flat list. */
function normalizeScopes(scopes: AuthScopes | string[]): AuthScopes {
    if (!Array.isArray(scopes)) {
        return scopes
    }

    const isProjectsScope = (scope: string) => scope.startsWith('ZohoProjects.')

    return { crm: scopes.filter((scope) => !isProjectsScope(scope)), projects: scopes.filter(isProjectsScope) }
}

/** Lets commands run from a nested folder. Returns `null` when no ancestor is a project. */
export async function findProjectPath(startPath: string = process.cwd()): Promise<string | null> {
    let currentPath = resolve(startPath)

    for (;;) {
        if (await Bun.file(resolveWorkspaceSettingsPath(currentPath)).exists()) {
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
