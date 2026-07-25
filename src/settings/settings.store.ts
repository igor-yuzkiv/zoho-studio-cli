import { chmod } from 'node:fs/promises'
import { resolve } from 'node:path'

import { writeJsonFile } from '@/shared/json.utils'

import { loadProjectSettings } from './settings.loader'
import { resolveProjectSettingsPath } from '@/config'
import type { ProjectSettings } from './types'

// Edits made outside the running CLI are not picked up.
const cachedSettings = new Map<string, ProjectSettings>()

export async function getProjectSettings(projectPath: string = process.cwd()): Promise<ProjectSettings> {
    const cacheKey = resolve(projectPath)
    const cached = cachedSettings.get(cacheKey)

    if (cached) {
        return cached
    }

    const settings = await loadProjectSettings(projectPath)
    cachedSettings.set(cacheKey, settings)

    return settings
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
