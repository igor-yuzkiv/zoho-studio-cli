import { afterEach, describe, expect, test } from 'bun:test'

import { pollDeviceToken } from '@/api/auth'

let server: ReturnType<typeof Bun.serve> | null = null
let lastRequestUrl: URL | null = null

function startServer(body: unknown): string {
    server = Bun.serve({
        port: 0,
        fetch(request) {
            lastRequestUrl = new URL(request.url)
            return new Response(JSON.stringify(body))
        },
    })

    return server.url.origin
}

afterEach(() => {
    server?.stop(true)
    server = null
    lastRequestUrl = null
})

function poll(baseUrl: string) {
    return pollDeviceToken({ baseUrl, clientId: '1000.CLIENT', clientSecret: 'secret', deviceCode: 'device' })
}

describe('pollDeviceToken', () => {
    test('sends the device token parameters and maps issued tokens', async () => {
        const baseUrl = startServer({
            access_token: 'access',
            refresh_token: 'refresh',
            expires_in: 3600,
            api_domain: 'https://www.zohoapis.com',
            token_type: 'Bearer',
        })

        const before = Date.now()
        const result = await poll(baseUrl)

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
        const baseUrl = startServer({ error: 'authorization_pending' })

        expect(await poll(baseUrl)).toEqual({ status: 'pending' })
    })

    test('treats slow_down as waiting rather than failure', async () => {
        const baseUrl = startServer({ error: 'slow_down' })

        expect(await poll(baseUrl)).toEqual({ status: 'slow_down' })
    })

    test('fails when the user denied the request', async () => {
        const baseUrl = startServer({ error: 'access_denied' })

        await expect(poll(baseUrl)).rejects.toThrow(/access_denied.*denied in the browser/s)
    })

    test('explains a wrong data center', async () => {
        const baseUrl = startServer({ error: 'other_dc' })

        await expect(poll(baseUrl)).rejects.toThrow(/other_dc.*data center/s)
    })

    test('explains a wrong client secret', async () => {
        const baseUrl = startServer({ error: 'invalid_client_secret' })

        await expect(poll(baseUrl)).rejects.toThrow(/invalid_client_secret.*auth\.clientSecret/s)
    })

    test('fails when the response carries no tokens', async () => {
        const baseUrl = startServer({ access_token: 'access' })

        await expect(poll(baseUrl)).rejects.toThrow(/without an access token or a refresh token/)
    })

    test('fails when the accounts server is unreachable', async () => {
        const baseUrl = startServer({})
        server?.stop(true)

        await expect(poll(baseUrl)).rejects.toThrow()
    })
})
