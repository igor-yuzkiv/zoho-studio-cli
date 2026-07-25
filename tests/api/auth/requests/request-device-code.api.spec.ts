import { afterEach, describe, expect, test } from 'bun:test'

import { requestDeviceCode } from '@/api/auth'

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

function request(baseUrl: string) {
    return requestDeviceCode({ baseUrl, clientId: '1000.CLIENT', scopes: ['A', 'B'] })
}

describe('requestDeviceCode', () => {
    test('asks for an offline device code and maps the response', async () => {
        const baseUrl = startServer({
            device_code: 'device',
            user_code: 'USER-CODE',
            verification_url: 'https://accounts.zoho.com/oauth/v3/device',
            interval: 5000,
            expires_in: 300_000,
        })

        const deviceCode = await request(baseUrl)

        expect(lastRequestUrl?.pathname).toBe('/oauth/v3/device/code')
        expect(Object.fromEntries(lastRequestUrl!.searchParams)).toEqual({
            client_id: '1000.CLIENT',
            grant_type: 'device_request',
            scope: 'A,B',
            access_type: 'offline',
        })
        expect(deviceCode).toEqual({
            deviceCode: 'device',
            userCode: 'USER-CODE',
            verificationUrl: 'https://accounts.zoho.com/oauth/v3/device',
            pollIntervalMs: 5000,
            expiresInMs: 300_000,
        })
    })

    test('trims a trailing slash from the base url', async () => {
        const baseUrl = startServer({ device_code: 'device', user_code: 'U', verification_url: 'https://zoho' })

        await request(`${baseUrl}/`)

        expect(lastRequestUrl?.pathname).toBe('/oauth/v3/device/code')
    })

    test('explains a rejected scope', async () => {
        const baseUrl = startServer({ error: 'invalid_scope' })

        await expect(request(baseUrl)).rejects.toThrow(/invalid_scope.*auth\.scopes/s)
    })

    test('explains an unknown client', async () => {
        const baseUrl = startServer({ error: 'invalid_client' })

        await expect(request(baseUrl)).rejects.toThrow(/invalid_client.*auth\.clientId/s)
    })

    test('fails on an incomplete response', async () => {
        const baseUrl = startServer({ device_code: 'device' })

        await expect(request(baseUrl)).rejects.toThrow(/incomplete device code response/)
    })

    test('fails when the accounts server is unreachable', async () => {
        const baseUrl = startServer({})
        server?.stop(true)

        await expect(request(baseUrl)).rejects.toThrow()
    })
})
