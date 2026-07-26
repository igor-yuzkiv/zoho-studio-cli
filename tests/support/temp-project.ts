import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { resolveProjectSettingsPath } from '@/config'
import { clearProjectCache, defaultProjectSettings, type ProjectSettings } from '@/settings'

const initialCwd = process.cwd()

export function buildSettings({
    auth = {},
    api = {},
    crm = {},
    logs = {},
}: {
    auth?: Partial<ProjectSettings['auth']>
    api?: Partial<ProjectSettings['api']>
    crm?: Partial<ProjectSettings['crm']>
    logs?: Partial<ProjectSettings['logs']>
} = {}): ProjectSettings {
    return {
        auth: { ...defaultProjectSettings.auth, clientId: '1000.CLIENT', clientSecret: 'secret', ...auth },
        api: { ...defaultProjectSettings.api, ...api },
        crm: { ...defaultProjectSettings.crm, ...crm },
        logs: { ...defaultProjectSettings.logs, ...logs },
    }
}

/** The API clients resolve the project from the working directory, so tests run inside one. */
export async function createTempProject(settings: ProjectSettings = buildSettings()): Promise<string> {
    clearProjectCache()

    const projectPath = await mkdtemp(join(tmpdir(), 'zoho-studio-'))
    await Bun.write(resolveProjectSettingsPath(projectPath), JSON.stringify(settings))
    process.chdir(projectPath)

    return projectPath
}

export async function removeTempProject(projectPath: string): Promise<void> {
    process.chdir(initialCwd)
    await rm(projectPath, { recursive: true, force: true })
    clearProjectCache()
}

export function readStoredSettings(projectPath: string): Promise<ProjectSettings> {
    return Bun.file(resolveProjectSettingsPath(projectPath)).json()
}
