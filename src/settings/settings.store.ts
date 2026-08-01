import { chmod } from 'node:fs/promises'
import { resolve } from 'node:path'

import { writeJsonFile } from '@/shared/utils'

import { findProjectPath, loadProjectSettings } from './settings.loader'
import { projectSettingsRelativePath, resolveProjectSettingsPath } from '@/config'
import type { ProjectContext, ProjectSettings } from './types'

// Edits made outside the running CLI are not picked up.
const cachedSettings = new Map<string, ProjectSettings>()

/** Walks up from `startPath` to the project root, so commands work from any subfolder. */
export async function getProjectSettings(startPath: string = process.cwd()): Promise<ProjectContext> {
    const projectPath = await findProjectPath(startPath)

    if (!projectPath) {
        throw new Error(
            `No ${projectSettingsRelativePath} found in ${resolve(startPath)} or any parent. ` +
                'Run "zoho-studio init" first.'
        )
    }

    const cached = cachedSettings.get(projectPath)

    if (cached) {
        return { projectPath, settings: cached }
    }

    const settings = await loadProjectSettings(projectPath)
    cachedSettings.set(projectPath, settings)

    return { projectPath, settings }
}

export async function saveProjectSettings(projectPath: string, settings: ProjectSettings): Promise<void> {
    const settingsPath = resolveProjectSettingsPath(projectPath)

    // bunfig only reads config, so the file is written by hand.
    await writeJsonFile(settingsPath, settings)
    // Holds the client secret and refresh token, so keep it readable by the owner only.
    await chmod(settingsPath, 0o600)

    cachedSettings.set(resolve(projectPath), settings)
}

/**
 * Drops the in-memory settings. bunfig keeps its own cache of the parsed file, so a re-read of a
 * path that was already loaded may still return the earlier contents.
 */
export function clearProjectCache(): void {
    cachedSettings.clear()
}
