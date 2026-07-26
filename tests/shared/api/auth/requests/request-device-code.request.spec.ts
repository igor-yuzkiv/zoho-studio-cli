import { afterEach, describe, expect, test } from 'bun:test'

import { requestDeviceCode } from '@/shared/api/auth'

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

function request() {
    return requestDeviceCode({ clientId: '1000.CLIENT', scopes: ['A', 'B'] })
}

describe('requestDeviceCode', () => {
    test('asks for an offline device code and maps the response', async () => {
        await startZoho({
            device_code: 'device',
            user_code: 'USER-CODE',
            verification_url: 'https://accounts.zoho.com/oauth/v3/device',
            interval: 5000,
            expires_in: 300_000,
        })

        const deviceCode = await request()

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

    test('explains a rejected scope', async () => {
        await startZoho({ error: 'invalid_scope' })

        await expect(request()).rejects.toThrow(/invalid_scope.*auth\.scopes/s)
    })

    test('explains an unknown client', async () => {
        await startZoho({ error: 'invalid_client' })

        await expect(request()).rejects.toThrow(/invalid_client.*auth\.clientId/s)
    })

    test('fails on an incomplete response', async () => {
        await startZoho({ device_code: 'device' })

        await expect(request()).rejects.toThrow(/incomplete device code response/)
    })

    test('reports an unreachable accounts server', async () => {
        await startZoho({})
        server?.stop(true)

        await expect(request()).rejects.toThrow(/Could not reach the Zoho accounts server/)
    })
})
