import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { resolveWorkspaceSettingsPath } from '@/config'
import {
    addProfile,
    credentialsHomeEnvName,
    readConnection,
    saveConnection,
    type ConnectionTokens,
} from '@/credentials'
import { clearProjectCache, defaultProjectSettings, type ProjectSettings } from '@/settings'

const initialCwd = process.cwd()

export const testProfileName = 'test'

export type StoredTokens = Omit<ConnectionTokens, 'profile'>

/**
 * Project settings plus what a test wants in the credential store: the client becomes the
 * "test" profile and the tokens its connection, so a spec reads like the project it describes.
 */
export interface TestProjectSettings extends ProjectSettings {
    auth: ProjectSettings['auth'] & { clientId?: string; clientSecret?: string; tokens?: StoredTokens }
}

export function buildSettings({
    auth = {},
    api = {},
    logs = {},
    projects = {},
    presets = defaultProjectSettings.presets,
}: {
    auth?: Partial<TestProjectSettings['auth']>
    api?: Partial<ProjectSettings['api']>
    logs?: Partial<ProjectSettings['logs']>
    projects?: Partial<ProjectSettings['projects']>
    presets?: ProjectSettings['presets']
} = {}): TestProjectSettings {
    return {
        auth: { ...defaultProjectSettings.auth, clientId: '1000.CLIENT', clientSecret: 'secret', ...auth },
        api: { ...defaultProjectSettings.api, ...api },
        logs: { ...defaultProjectSettings.logs, ...logs },
        projects: { ...defaultProjectSettings.projects, ...projects },
        presets,
    }
}

/** Points the credential store at a fresh folder, so no test reads or writes the real `~/.zoho-studio`. */
export async function useTempCredentialsHome(): Promise<string> {
    const home = await mkdtemp(join(tmpdir(), 'zoho-studio-home-'))
    process.env[credentialsHomeEnvName] = home

    return home
}

/** The API clients resolve the project from the working directory, so tests run inside one. */
export async function createTempProject(settings: TestProjectSettings = buildSettings()): Promise<string> {
    clearProjectCache()
    await useTempCredentialsHome()

    const { clientId, clientSecret, tokens, ...auth } = settings.auth
    const projectPath = await mkdtemp(join(tmpdir(), 'zoho-studio-'))
    await Bun.write(resolveWorkspaceSettingsPath(projectPath), JSON.stringify({ ...settings, auth }))

    if (clientId && clientSecret) {
        await addProfile({ name: testProfileName, clientId, clientSecret })
    }

    if (tokens) {
        await saveConnection(projectPath, { profile: testProfileName, ...tokens })
    }

    process.chdir(projectPath)

    return projectPath
}

export async function removeTempProject(projectPath: string): Promise<void> {
    process.chdir(initialCwd)
    await rm(projectPath, { recursive: true, force: true })

    const home = process.env[credentialsHomeEnvName]

    if (home) {
        await rm(home, { recursive: true, force: true })
        delete process.env[credentialsHomeEnvName]
    }

    clearProjectCache()
}

export async function readStoredTokens(projectPath: string): Promise<ConnectionTokens | null> {
    return readConnection(projectPath)
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
