import { afterEach, describe, expect, test } from 'bun:test'

import { refreshAccessToken } from '@/api/auth'

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

function refresh(baseUrl: string) {
    return refreshAccessToken({ baseUrl, clientId: '1000.CLIENT', clientSecret: 'secret', refreshToken: 'refresh' })
}

describe('refreshAccessToken', () => {
    test('sends the refresh parameters and maps the new access token', async () => {
        const baseUrl = startServer({
            access_token: 'fresh',
            expires_in: 3600,
            api_domain: 'https://www.zohoapis.com',
            token_type: 'Bearer',
        })

        const before = Date.now()
        const token = await refresh(baseUrl)

        expect(lastRequestUrl?.pathname).toBe('/oauth/v2/token')
        expect(Object.fromEntries(lastRequestUrl!.searchParams)).toEqual({
            client_id: '1000.CLIENT',
            client_secret: 'secret',
            grant_type: 'refresh_token',
            refresh_token: 'refresh',
        })
        expect(token.accessToken).toBe('fresh')
        expect(token.apiDomain).toBe('https://www.zohoapis.com')
        expect(token.accessTokenExpiresAt).toBeGreaterThanOrEqual(before + 3_600_000)
    })

    test('explains a revoked refresh token', async () => {
        const baseUrl = startServer({ error: 'invalid_code' })

        await expect(refresh(baseUrl)).rejects.toThrow(/refresh token is no longer valid.*zoho-studio login/s)
    })

    test('explains a wrong client secret', async () => {
        const baseUrl = startServer({ error: 'invalid_client_secret' })

        await expect(refresh(baseUrl)).rejects.toThrow(/invalid_client_secret.*auth\.clientSecret/s)
    })

    test('fails when the response carries no access token', async () => {
        const baseUrl = startServer({ token_type: 'Bearer' })

        await expect(refresh(baseUrl)).rejects.toThrow(/without an access token/)
    })

    test('fails when the accounts server is unreachable', async () => {
        const baseUrl = startServer({})
        server?.stop(true)

        await expect(refresh(baseUrl)).rejects.toThrow()
    })
})
