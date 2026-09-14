import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { resolveWorkspaceSettingsPath } from '@/config'
import { clearProjectCache, defaultProjectSettings, type ProjectSettings } from '@/settings'

const initialCwd = process.cwd()

export function buildSettings({
    auth = {},
    api = {},
    logs = {},
    projects = {},
}: {
    auth?: Partial<ProjectSettings['auth']>
    api?: Partial<ProjectSettings['api']>
    logs?: Partial<ProjectSettings['logs']>
    projects?: Partial<ProjectSettings['projects']>
} = {}): ProjectSettings {
    return {
        auth: { ...defaultProjectSettings.auth, clientId: '1000.CLIENT', clientSecret: 'secret', ...auth },
        api: { ...defaultProjectSettings.api, ...api },
        logs: { ...defaultProjectSettings.logs, ...logs },
        projects: { ...defaultProjectSettings.projects, ...projects },
    }
}

/** The API clients resolve the project from the working directory, so tests run inside one. */
export async function createTempProject(settings: ProjectSettings = buildSettings()): Promise<string> {
    clearProjectCache()

    const projectPath = await mkdtemp(join(tmpdir(), 'zoho-studio-'))
    await Bun.write(resolveWorkspaceSettingsPath(projectPath), JSON.stringify(settings))
    process.chdir(projectPath)

    return projectPath
}

export async function removeTempProject(projectPath: string): Promise<void> {
    process.chdir(initialCwd)
    await rm(projectPath, { recursive: true, force: true })
    clearProjectCache()
}

export function readStoredSettings(projectPath: string): Promise<ProjectSettings> {
    return Bun.file(resolveWorkspaceSettingsPath(projectPath)).json()
}

/** Writes one file below `src/zoho-projects/raw/` of the project — a JSON value, or a raw string for a broken file. */
export async function writeRawFile(projectPath: string, relativePath: string, content: unknown): Promise<void> {
    const filePath = join(projectPath, 'src/zoho-projects/raw', relativePath)

    await mkdir(join(filePath, '..'), { recursive: true })
    await Bun.write(filePath, typeof content === 'string' ? content : JSON.stringify(content))
}
