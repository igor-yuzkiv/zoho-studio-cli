import { afterEach, describe, expect, test } from 'bun:test'

import { refreshAccessToken } from '@/shared/api/auth'

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

function refresh() {
    return refreshAccessToken({ clientId: '1000.CLIENT', clientSecret: 'secret', refreshToken: 'refresh' })
}

describe('refreshAccessToken', () => {
    test('sends the refresh parameters and maps the new access token', async () => {
        await startZoho({
            access_token: 'fresh',
            expires_in: 3600,
            api_domain: 'https://www.zohoapis.com',
            token_type: 'Bearer',
        })

        const before = Date.now()
        const token = await refresh()

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
        await startZoho({ error: 'invalid_code' })

        await expect(refresh()).rejects.toThrow(/refresh token is no longer valid.*zoho-studio login/s)
    })

    test('explains a wrong client secret', async () => {
        await startZoho({ error: 'invalid_client_secret' })

        await expect(refresh()).rejects.toThrow(/invalid_client_secret.*auth\.clientSecret/s)
    })

    test('fails when the response carries no access token', async () => {
        await startZoho({ token_type: 'Bearer' })

        await expect(refresh()).rejects.toThrow(/without an access token/)
    })

    test('reports an unreachable accounts server', async () => {
        await startZoho({})
        server?.stop(true)

        await expect(refresh()).rejects.toThrow(/Could not reach the Zoho accounts server/)
    })
})
