import { afterEach, describe, expect, test } from 'bun:test'

import { pollDeviceToken } from '@/shared/api/auth'

import { buildSettings, createTempProject, removeTempProject } from '../../../../support/temp-project'

let projectPath: string | null = null
let server: ReturnType<typeof Bun.serve> | null = null
let lastRequestUrl: URL | null = null

async function startZoho(body: unknown): Promise<void> {
    server = Bun.serve({
        port: 0,
        fetch(request) {
            lastRequestUrl = new URL(request.url)
            return Response.json(body)
        },
    })

    projectPath = await createTempProject(buildSettings({ auth: { baseUrl: server.url.origin } }))
}

afterEach(async () => {
    server?.stop(true)
    server = null
    lastRequestUrl = null

    if (projectPath) {
        await removeTempProject(projectPath)
        projectPath = null
    }
})

function poll() {
    return pollDeviceToken({ clientId: '1000.CLIENT', clientSecret: 'secret', deviceCode: 'device' })
}

describe('pollDeviceToken', () => {
    test('sends the device token parameters and maps issued tokens', async () => {
        await startZoho({
            access_token: 'access',
            refresh_token: 'refresh',
            expires_in: 3600,
            api_domain: 'https://www.zohoapis.com',
            token_type: 'Bearer',
        })

        const before = Date.now()
        const result = await poll()

        expect(lastRequestUrl?.pathname).toBe('/oauth/v3/device/token')
        expect(Object.fromEntries(lastRequestUrl!.searchParams)).toEqual({
            client_id: '1000.CLIENT',
            client_secret: 'secret',
            grant_type: 'device_token',
            code: 'device',
        })
        expect(result).toEqual({
            status: 'authorized',
            tokens: {
                accessToken: 'access',
                refreshToken: 'refresh',
                accessTokenExpiresAt: expect.any(Number),
                apiDomain: 'https://www.zohoapis.com',
                tokenType: 'Bearer',
            },
        })
        expect(result.status === 'authorized' && result.tokens.accessTokenExpiresAt).toBeGreaterThanOrEqual(
            before + 3_600_000
        )
    })

    test('treats authorization_pending as waiting rather than failure', async () => {
        await startZoho({ error: 'authorization_pending' })

        expect(await poll()).toEqual({ status: 'pending' })
    })

    test('treats slow_down as waiting rather than failure', async () => {
        await startZoho({ error: 'slow_down' })

        expect(await poll()).toEqual({ status: 'slow_down' })
    })

    test('fails when the user denied the request', async () => {
        await startZoho({ error: 'access_denied' })

        await expect(poll()).rejects.toThrow(/access_denied.*denied in the browser/s)
    })

    test('explains a wrong data center', async () => {
        await startZoho({ error: 'other_dc' })

        await expect(poll()).rejects.toThrow(/other_dc.*data center/s)
    })

    test('explains a wrong client secret', async () => {
        await startZoho({ error: 'invalid_client_secret' })

        await expect(poll()).rejects.toThrow(/invalid_client_secret.*auth\.clientSecret/s)
    })

    test('fails when the response carries no tokens', async () => {
        await startZoho({ access_token: 'access' })

        await expect(poll()).rejects.toThrow(/without an access token or a refresh token/)
    })

    test('reports an unreachable accounts server', async () => {
        await startZoho({})
        server?.stop(true)

        await expect(poll()).rejects.toThrow(/Could not reach the Zoho accounts server/)
    })
})
