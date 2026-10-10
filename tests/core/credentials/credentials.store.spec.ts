import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { rm, stat } from 'node:fs/promises'

import {
    addProfile,
    credentialsHomeEnvName,
    encodeProjectKey,
    listProfiles,
    readConnection,
    resolveProfilesPath,
    resolveProjectTokensPath,
    saveConnection,
} from '@zoho-studio/core'

import { useTempCredentialsHome } from '../../support/temp-project'

let home: string

beforeEach(async () => {
    home = await useTempCredentialsHome()
})

afterEach(async () => {
    await rm(home, { recursive: true, force: true })
    delete process.env[credentialsHomeEnvName]
})

const tokens = { profile: 'acme', accessToken: 'a', refreshToken: 'r', accessTokenExpiresAt: 1 }

describe('credential store', () => {
    test('encodes a project path the way Claude Code names its folders', () => {
        expect(encodeProjectKey('/home/u/x')).toBe('-home-u-x')
    })

    test('keeps the store under the overridden home', () => {
        expect(resolveProfilesPath()).toBe(`${home}/profiles.json`)
        expect(resolveProjectTokensPath('/home/u/x')).toBe(`${home}/projects/-home-u-x/tokens.json`)
    })

    test('stores profiles owner-only and refuses a duplicate name', async () => {
        await addProfile({ name: 'acme', clientId: '1000.A', clientSecret: 's' })

        await expect(addProfile({ name: 'acme', clientId: '1000.B', clientSecret: 's' })).rejects.toThrow(
            /already exists/
        )
        expect(await listProfiles()).toEqual([{ name: 'acme', clientId: '1000.A', clientSecret: 's' }])
        expect((await stat(resolveProfilesPath())).mode & 0o777).toBe(0o600)
        expect((await stat(home)).mode & 0o777).toBe(0o700)
    })

    test('stores project tokens owner-only with the project path', async () => {
        await saveConnection('/home/u/x', tokens)

        expect(await readConnection('/home/u/x')).toEqual(tokens)
        expect(await Bun.file(resolveProjectTokensPath('/home/u/x')).json()).toMatchObject({ projectPath: '/home/u/x' })
        expect((await stat(resolveProjectTokensPath('/home/u/x'))).mode & 0o777).toBe(0o600)
        expect((await stat(`${home}/projects/-home-u-x`)).mode & 0o777).toBe(0o700)
    })

    test('refuses tokens of another project whose path maps to the same key', async () => {
        await saveConnection('/home/u/a-b', tokens)

        await expect(readConnection('/home/u/a/b')).rejects.toThrow(/belongs to \/home\/u\/a-b/)
    })

    test('returns null for a project that was never authorized', async () => {
        expect(await readConnection('/home/u/none')).toBeNull()
    })
})
