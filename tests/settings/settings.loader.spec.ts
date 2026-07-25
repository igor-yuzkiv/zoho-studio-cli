import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { resolveProjectSettingsPath } from '@/config'
import { defaultProjectSettings, findProjectPath, loadProjectSettings } from '@/settings'

let projectPath: string

beforeEach(async () => {
    projectPath = await mkdtemp(join(tmpdir(), 'zoho-studio-loader-'))
})

afterEach(async () => {
    await rm(projectPath, { recursive: true, force: true })
})

describe('project settings loader', () => {
    test('falls back to the defaults when settings.json is absent', async () => {
        expect(await loadProjectSettings(projectPath)).toEqual(defaultProjectSettings)
    })

    test('merges a partial settings.json into the defaults', async () => {
        await Bun.write(resolveProjectSettingsPath(projectPath), JSON.stringify({ api: { version: 'v9' } }))

        const settings = await loadProjectSettings(projectPath)

        expect(settings.api.version).toBe('v9')
        expect(settings.api.baseUrl).toBe(defaultProjectSettings.api.baseUrl)
        expect(settings.auth.scopes).toEqual(defaultProjectSettings.auth.scopes)
    })

    test('merges credentials and tokens from the same file', async () => {
        await Bun.write(
            resolveProjectSettingsPath(projectPath),
            JSON.stringify({ auth: { clientId: '1000.CLIENT', tokens: { refreshToken: 'refresh' } } })
        )

        const settings = await loadProjectSettings(projectPath)

        expect(settings.auth.clientId).toBe('1000.CLIENT')
        expect(settings.auth.tokens.refreshToken).toBe('refresh')
        expect(settings.auth.tokens.accessTokenExpiresAt).toBe(0)
        expect(settings.auth.baseUrl).toBe(defaultProjectSettings.auth.baseUrl)
    })

    test('ignores ambient SETTINGS_* environment variables for keys settings.json omits', async () => {
        await Bun.write(resolveProjectSettingsPath(projectPath), JSON.stringify({ api: { version: 'v9' } }))
        process.env.SETTINGS_API_BASEURL = 'https://hijacked.example'

        try {
            expect((await loadProjectSettings(projectPath)).api.baseUrl).toBe(defaultProjectSettings.api.baseUrl)
        } finally {
            delete process.env.SETTINGS_API_BASEURL
        }
    })

    test('does not pick up a parent folder settings.json', async () => {
        await Bun.write(resolveProjectSettingsPath(projectPath), JSON.stringify({ api: { version: 'v1' } }))

        const nestedPath = join(projectPath, 'nested')

        expect((await loadProjectSettings(nestedPath)).api.version).toBe(defaultProjectSettings.api.version)
    })
})

describe('findProjectPath', () => {
    test('finds the project when started from the project folder itself', async () => {
        await Bun.write(resolveProjectSettingsPath(projectPath), '{}')

        expect(await findProjectPath(projectPath)).toBe(resolve(projectPath))
    })

    test('walks up from a nested folder', async () => {
        await Bun.write(resolveProjectSettingsPath(projectPath), '{}')

        const nestedPath = join(projectPath, 'functions', 'deals')
        await mkdir(nestedPath, { recursive: true })

        expect(await findProjectPath(nestedPath)).toBe(resolve(projectPath))
    })

    test('returns the nearest project when they are nested', async () => {
        await Bun.write(resolveProjectSettingsPath(projectPath), '{}')

        const innerProjectPath = join(projectPath, 'inner')
        await Bun.write(resolveProjectSettingsPath(innerProjectPath), '{}')

        expect(await findProjectPath(join(innerProjectPath, 'nested'))).toBe(resolve(innerProjectPath))
    })

    test('ignores a .zoho-studio folder without settings.json', async () => {
        await mkdir(join(projectPath, '.zoho-studio'), { recursive: true })

        expect(await findProjectPath(projectPath)).toBeNull()
    })

    test('returns null when no ancestor is a project', async () => {
        expect(await findProjectPath(projectPath)).toBeNull()
    })
})
