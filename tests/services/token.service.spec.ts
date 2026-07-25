import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { resolveProjectSettingsPath } from '@/config'
import { TokenService } from '@/services/auth'
import { clearProjectCache, defaultProjectSettings, type ProjectSettings } from '@/settings'

let projectPath: string
let server: ReturnType<typeof Bun.serve> | null = null
let refreshCallCount = 0

beforeEach(async () => {
    clearProjectCache()
    refreshCallCount = 0
    projectPath = await mkdtemp(join(tmpdir(), 'zoho-studio-token-'))
})

afterEach(async () => {
    server?.stop(true)
    server = null
    await rm(projectPath, { recursive: true, force: true })
})

function startZoho(body: unknown = { access_token: 'fresh', expires_in: 3600, token_type: 'Bearer' }): string {
    server = Bun.serve({
        port: 0,
        fetch() {
            refreshCallCount += 1
            return Response.json(body)
        },
    })

    return server.url.origin
}

function buildSettings(tokens: Partial<ProjectSettings['auth']['tokens']>, baseUrl: string): ProjectSettings {
    return {
        ...defaultProjectSettings,
        auth: {
            ...defaultProjectSettings.auth,
            baseUrl,
            clientId: '1000.CLIENT',
            clientSecret: 'secret',
            tokens: { ...defaultProjectSettings.auth.tokens, refreshToken: 'refresh', ...tokens },
        },
    }
}

function readStoredTokens(): Promise<ProjectSettings['auth']['tokens']> {
    return Bun.file(resolveProjectSettingsPath(projectPath))
        .json()
        .then((settings: ProjectSettings) => settings.auth.tokens)
}

const oneHourAhead = () => Date.now() + 3_600_000

describe('TokenService', () => {
    test('returns the stored token while it is still valid', async () => {
        const baseUrl = startZoho()
        const service = new TokenService(
            projectPath,
            buildSettings({ accessToken: 'stored', accessTokenExpiresAt: oneHourAhead() }, baseUrl)
        )

        expect(await service.getAccessToken()).toBe('stored')
        expect(refreshCallCount).toBe(0)
    })

    test('refreshes an expired token and persists the new one', async () => {
        const baseUrl = startZoho()
        const service = new TokenService(
            projectPath,
            buildSettings({ accessToken: 'stale', accessTokenExpiresAt: Date.now() - 1 }, baseUrl)
        )

        expect(await service.getAccessToken()).toBe('fresh')

        const stored = await readStoredTokens()
        expect(stored.accessToken).toBe('fresh')
        expect(stored.refreshToken).toBe('refresh')
        expect(stored.accessTokenExpiresAt).toBeGreaterThan(Date.now())
    })

    test('refreshes a token that is about to expire', async () => {
        const baseUrl = startZoho()
        const service = new TokenService(
            projectPath,
            buildSettings({ accessToken: 'stale', accessTokenExpiresAt: Date.now() + 10_000 }, baseUrl)
        )

        expect(await service.getAccessToken()).toBe('fresh')
    })

    test('refreshes when no access token was stored yet', async () => {
        const baseUrl = startZoho()
        const service = new TokenService(projectPath, buildSettings({ accessTokenExpiresAt: oneHourAhead() }, baseUrl))

        expect(await service.getAccessToken()).toBe('fresh')
    })

    test('reuses the stored token after a refresh instead of refreshing again', async () => {
        const baseUrl = startZoho()
        const service = new TokenService(
            projectPath,
            buildSettings({ accessToken: 'stale', accessTokenExpiresAt: Date.now() - 1 }, baseUrl)
        )

        await service.getAccessToken()
        expect(await service.getAccessToken()).toBe('fresh')
        expect(refreshCallCount).toBe(1)
    })

    test('refreshes once for concurrent callers', async () => {
        const baseUrl = startZoho()
        const service = new TokenService(
            projectPath,
            buildSettings({ accessToken: 'stale', accessTokenExpiresAt: Date.now() - 1 }, baseUrl)
        )

        const tokens = await Promise.all([service.getAccessToken(), service.getAccessToken()])

        expect(tokens).toEqual(['fresh', 'fresh'])
        expect(refreshCallCount).toBe(1)
    })

    test('fails with a hint about login when there is no refresh token', async () => {
        const baseUrl = startZoho()
        const service = new TokenService(projectPath, buildSettings({ refreshToken: '' }, baseUrl))

        await expect(service.getAccessToken()).rejects.toThrow(/No refresh token.*zoho-studio login/s)
        expect(refreshCallCount).toBe(0)
    })

    test('propagates a rejected refresh token and keeps the stored tokens', async () => {
        const baseUrl = startZoho({ error: 'invalid_code' })
        const settings = buildSettings({ accessToken: 'stale', accessTokenExpiresAt: Date.now() - 1 }, baseUrl)
        await Bun.write(resolveProjectSettingsPath(projectPath), JSON.stringify(settings))
        const service = new TokenService(projectPath, settings)

        await expect(service.getAccessToken()).rejects.toThrow(/refresh token is no longer valid/)

        expect((await readStoredTokens()).accessToken).toBe('stale')
    })

    test('retries the refresh after a failure', async () => {
        const baseUrl = startZoho({ error: 'invalid_client_secret' })
        const service = new TokenService(
            projectPath,
            buildSettings({ accessToken: 'stale', accessTokenExpiresAt: Date.now() - 1 }, baseUrl)
        )

        await expect(service.getAccessToken()).rejects.toThrow()
        await expect(service.getAccessToken()).rejects.toThrow()
        expect(refreshCallCount).toBe(2)
    })
})
