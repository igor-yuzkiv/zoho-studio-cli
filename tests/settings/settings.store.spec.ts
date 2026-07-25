import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { resolveProjectSettingsPath } from '@/config'
import { clearProjectCache, defaultProjectSettings, getProjectSettings, saveProjectSettings } from '@/settings'

let projectPath: string

beforeEach(async () => {
    clearProjectCache()
    projectPath = await mkdtemp(join(tmpdir(), 'zoho-studio-store-'))
})

afterEach(async () => {
    await rm(projectPath, { recursive: true, force: true })
})

describe('project store reads and writes', () => {
    test('round-trips settings, credentials and tokens', async () => {
        const settings = {
            ...defaultProjectSettings,
            auth: {
                ...defaultProjectSettings.auth,
                clientId: '1000.CLIENT',
                clientSecret: 'secret',
                tokens: { accessToken: 'access', refreshToken: 'refresh', accessTokenExpiresAt: 1_700_000_000_000 },
            },
            api: { baseUrl: 'https://www.zohoapis.eu', version: 'v7' },
        }

        await saveProjectSettings(projectPath, settings)
        clearProjectCache()

        expect(await getProjectSettings(projectPath)).toEqual(settings)
    })

    test('restricts settings.json to the owner', async () => {
        await saveProjectSettings(projectPath, defaultProjectSettings)

        const mode = (await stat(resolveProjectSettingsPath(projectPath))).mode & 0o777

        expect(mode).toBe(0o600)
    })
})

describe('project store caching', () => {
    test('serves settings from cache instead of re-reading the file', async () => {
        await Bun.write(resolveProjectSettingsPath(projectPath), JSON.stringify({ api: { version: 'v9' } }))
        expect((await getProjectSettings(projectPath)).api.version).toBe('v9')

        await Bun.write(resolveProjectSettingsPath(projectPath), JSON.stringify({ api: { version: 'CHANGED' } }))

        expect((await getProjectSettings(projectPath)).api.version).toBe('v9')
    })

    test('a write stays visible after clearProjectCache', async () => {
        const settings = { ...defaultProjectSettings, api: { ...defaultProjectSettings.api, version: 'v7' } }

        await saveProjectSettings(projectPath, settings)
        clearProjectCache()

        expect((await getProjectSettings(projectPath)).api.version).toBe('v7')
    })

    test('a write refreshes the cached value', async () => {
        await getProjectSettings(projectPath)

        const settings = { ...defaultProjectSettings, api: { ...defaultProjectSettings.api, version: 'v7' } }
        await saveProjectSettings(projectPath, settings)

        expect((await getProjectSettings(projectPath)).api.version).toBe('v7')
    })

    test('caches each project path separately', async () => {
        const otherProjectPath = await mkdtemp(join(tmpdir(), 'zoho-studio-store-other-'))

        try {
            await Bun.write(resolveProjectSettingsPath(projectPath), JSON.stringify({ api: { version: 'v9' } }))
            await Bun.write(resolveProjectSettingsPath(otherProjectPath), JSON.stringify({ api: { version: 'v7' } }))

            expect((await getProjectSettings(projectPath)).api.version).toBe('v9')
            expect((await getProjectSettings(otherProjectPath)).api.version).toBe('v7')
        } finally {
            await rm(otherProjectPath, { recursive: true, force: true })
        }
    })
})
