import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { TokenService } from '@/api/auth'
import type { ProjectSettings } from '@/settings'

import { buildSettings, createTempProject, readStoredSettings, removeTempProject } from '../../support/temp-project'

let projectPath: string | null = null
let server: ReturnType<typeof Bun.serve> | null = null
let refreshCallCount = 0

beforeEach(() => {
    refreshCallCount = 0
})

afterEach(async () => {
    server?.stop(true)
    server = null

    if (projectPath) {
        await removeTempProject(projectPath)
        projectPath = null
    }
})

const oneHourAhead = () => Date.now() + 3_600_000

async function startProject(
    tokens: Partial<ProjectSettings['auth']['tokens']>,
    refreshAnswer: unknown = { access_token: 'fresh', expires_in: 3600, token_type: 'Bearer' }
): Promise<void> {
    server = Bun.serve({
        port: 0,
        fetch() {
            refreshCallCount += 1
            return Response.json(refreshAnswer)
        },
    })

    projectPath = await createTempProject(
        buildSettings({
            auth: {
                baseUrl: server.url.origin,
                tokens: { accessToken: '', refreshToken: 'refresh', accessTokenExpiresAt: 0, ...tokens },
            },
        })
    )
}

function readStoredTokens(): Promise<ProjectSettings['auth']['tokens']> {
    return readStoredSettings(projectPath!).then((settings) => settings.auth.tokens)
}

describe('TokenService', () => {
    test('returns the stored token while it is still valid', async () => {
        await startProject({ accessToken: 'stored', accessTokenExpiresAt: oneHourAhead() })

        expect(await new TokenService().getAccessToken()).toBe('stored')
        expect(refreshCallCount).toBe(0)
    })

    test('refreshes an expired token and persists the new one', async () => {
        await startProject({ accessToken: 'stale', accessTokenExpiresAt: Date.now() - 1 })

        expect(await new TokenService().getAccessToken()).toBe('fresh')

        const stored = await readStoredTokens()
        expect(stored.accessToken).toBe('fresh')
        expect(stored.refreshToken).toBe('refresh')
        expect(stored.accessTokenExpiresAt).toBeGreaterThan(Date.now())
    })

    test('refreshes a token that is about to expire', async () => {
        await startProject({ accessToken: 'stale', accessTokenExpiresAt: Date.now() + 10_000 })

        expect(await new TokenService().getAccessToken()).toBe('fresh')
    })

    test('refreshes when no access token was stored yet', async () => {
        await startProject({ accessTokenExpiresAt: oneHourAhead() })

        expect(await new TokenService().getAccessToken()).toBe('fresh')
    })

    test('reuses the refreshed token instead of refreshing again', async () => {
        await startProject({ accessToken: 'stale', accessTokenExpiresAt: Date.now() - 1 })
        const service = new TokenService()

        await service.getAccessToken()

        expect(await service.getAccessToken()).toBe('fresh')
        expect(refreshCallCount).toBe(1)
    })

    test('refreshes once for concurrent callers', async () => {
        await startProject({ accessToken: 'stale', accessTokenExpiresAt: Date.now() - 1 })
        const service = new TokenService()

        expect(await Promise.all([service.getAccessToken(), service.getAccessToken()])).toEqual(['fresh', 'fresh'])
        expect(refreshCallCount).toBe(1)
    })

    test('fails with a hint about login when there is no refresh token', async () => {
        await startProject({ refreshToken: '' })

        await expect(new TokenService().getAccessToken()).rejects.toThrow(/No refresh token.*zoho-studio login/s)
        expect(refreshCallCount).toBe(0)
    })

    test('propagates a rejected refresh token and keeps the stored tokens', async () => {
        await startProject({ accessToken: 'stale', accessTokenExpiresAt: Date.now() - 1 }, { error: 'invalid_code' })

        await expect(new TokenService().getAccessToken()).rejects.toThrow(/refresh token is no longer valid/)

        expect((await readStoredTokens()).accessToken).toBe('stale')
    })

    test('retries the refresh after a failure', async () => {
        await startProject(
            { accessToken: 'stale', accessTokenExpiresAt: Date.now() - 1 },
            { error: 'invalid_client_secret' }
        )
        const service = new TokenService()

        await expect(service.getAccessToken()).rejects.toThrow()
        await expect(service.getAccessToken()).rejects.toThrow()
        expect(refreshCallCount).toBe(2)
    })
})
