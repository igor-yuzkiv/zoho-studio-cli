import { afterEach, describe, expect, test } from 'bun:test'
import { stat } from 'node:fs/promises'
import { basename } from 'node:path'

import { migrateLegacyAuth } from '@/commands/auth-migrate-legacy/migrate-legacy.service'
import { resolveWorkspaceSettingsPath } from '@zoho-studio/core'
import { addProfile, listProfiles, readConnection, saveConnection } from '@zoho-studio/core'

import { buildSettings, createTempProject, removeTempProject } from '../../support/temp-project'

let projectPath: string | null = null

afterEach(async () => {
    if (projectPath) {
        await removeTempProject(projectPath)
        projectPath = null
    }
})

const legacyTokens = { accessToken: 'access', refreshToken: 'refresh', accessTokenExpiresAt: 1_700_000_000_000 }

/** A project as an older CLI left it: the client and tokens inside settings.json, nothing in the store. */
async function startLegacyProject(auth: Record<string, unknown>): Promise<string> {
    projectPath = await createTempProject(buildSettings({ auth: { clientId: '', clientSecret: '' } }))
    const settingsPath = resolveWorkspaceSettingsPath(projectPath)
    const settings = await Bun.file(settingsPath).json()
    await Bun.write(settingsPath, JSON.stringify({ ...settings, auth: { ...settings.auth, ...auth } }))

    return projectPath
}

function readSettings(): Promise<{ auth: Record<string, unknown> }> {
    return Bun.file(resolveWorkspaceSettingsPath(projectPath!)).json()
}

const nameAs = (name: string) => ({ chooseProfileName: async () => name })

describe('migrateLegacyAuth', () => {
    test('moves the client into a new profile and the tokens into the store', async () => {
        await startLegacyProject({ clientId: '1000.OLD', clientSecret: 'old-secret', tokens: legacyTokens })

        const result = await migrateLegacyAuth(nameAs('acme'))

        expect(result).toEqual({
            status: 'migrated',
            profile: 'acme',
            profileCreated: true,
            tokensMoved: true,
            connectionProfile: 'acme',
        })
        expect(await listProfiles()).toEqual([{ name: 'acme', clientId: '1000.OLD', clientSecret: 'old-secret' }])
        expect(await readConnection(projectPath!)).toEqual({ profile: 'acme', ...legacyTokens })

        const settings = await readSettings()
        expect(settings.auth).not.toHaveProperty('clientId')
        expect(settings.auth).not.toHaveProperty('clientSecret')
        expect(settings.auth).not.toHaveProperty('tokens')
        expect(settings.auth).toHaveProperty('scopes')
        expect((await stat(resolveWorkspaceSettingsPath(projectPath!))).mode & 0o777).toBe(0o600)
    })

    test('suggests the project folder name for the new profile', async () => {
        await startLegacyProject({ clientId: '1000.OLD', clientSecret: 'old-secret' })
        let suggestion = ''

        await migrateLegacyAuth({ chooseProfileName: async (value) => (suggestion = value) })

        expect(suggestion).toBe(basename(projectPath!))
    })

    test('reuses a profile with the same client id', async () => {
        await startLegacyProject({ clientId: '1000.OLD', clientSecret: 'old-secret', tokens: legacyTokens })
        await addProfile({ name: 'shared', clientId: '1000.OLD', clientSecret: 'old-secret' })

        const result = await migrateLegacyAuth({
            chooseProfileName: () => Promise.reject(new Error('should not be asked')),
        })

        expect(result).toMatchObject({ profile: 'shared', profileCreated: false })
        expect(await listProfiles()).toHaveLength(1)
        expect((await readConnection(projectPath!))?.profile).toBe('shared')
    })

    test('keeps tokens the store already holds for the project', async () => {
        await startLegacyProject({ clientId: '1000.OLD', clientSecret: 'old-secret', tokens: legacyTokens })
        await saveConnection(projectPath!, { profile: 'newer', ...legacyTokens, accessToken: 'newer' })

        const result = await migrateLegacyAuth(nameAs('acme'))

        expect(result).toMatchObject({ tokensMoved: false, connectionProfile: 'newer' })
        expect((await readConnection(projectPath!))?.accessToken).toBe('newer')
    })

    test('reports nothing to migrate and leaves the file alone', async () => {
        await startLegacyProject({})
        const before = await Bun.file(resolveWorkspaceSettingsPath(projectPath!)).text()

        expect(await migrateLegacyAuth(nameAs('acme'))).toEqual({ status: 'nothing-to-migrate' })
        expect(await Bun.file(resolveWorkspaceSettingsPath(projectPath!)).text()).toBe(before)
    })

    test('runs twice without harm', async () => {
        await startLegacyProject({ clientId: '1000.OLD', clientSecret: 'old-secret', tokens: legacyTokens })

        await migrateLegacyAuth(nameAs('acme'))

        expect(await migrateLegacyAuth(nameAs('acme'))).toEqual({ status: 'nothing-to-migrate' })
    })

    test('keeps a flat scope list as it was written', async () => {
        await startLegacyProject({ clientId: '1000.OLD', clientSecret: 'old-secret', scopes: ['ZohoCRM.org.READ'] })

        await migrateLegacyAuth(nameAs('acme'))

        expect((await readSettings()).auth.scopes).toEqual(['ZohoCRM.org.READ'])
    })

    test('refuses an incomplete client and changes nothing', async () => {
        await startLegacyProject({ clientId: '1000.OLD', clientSecret: '', tokens: legacyTokens })

        await expect(migrateLegacyAuth(nameAs('acme'))).rejects.toThrow(/no complete client/)
        expect(await listProfiles()).toEqual([])
        expect((await readSettings()).auth).toHaveProperty('clientId')
    })
})
