import { afterEach, describe, expect, test } from 'bun:test'

import { getFunctionCode } from '@/entities/function'

import { buildSettings, createTempProject, removeTempProject } from '../../../support/temp-project'

let projectPath: string | null = null
let crmServer: ReturnType<typeof Bun.serve> | null = null
let accountsServer: ReturnType<typeof Bun.serve> | null = null
let lastPath: string | null = null

async function startProject(body: string, { status = 200, contentType = 'text/plain' } = {}): Promise<void> {
    crmServer = Bun.serve({
        port: 0,
        fetch(request) {
            lastPath = new URL(request.url).pathname

            return new Response(body, { status, headers: { 'Content-Type': contentType } })
        },
    })

    accountsServer = Bun.serve({
        port: 0,
        fetch: () => Response.json({ access_token: 'fresh', expires_in: 3600, token_type: 'Bearer' }),
    })

    projectPath = await createTempProject(
        buildSettings({
            auth: {
                baseUrl: accountsServer.url.origin,
                tokens: {
                    accessToken: 'access',
                    refreshToken: 'refresh',
                    accessTokenExpiresAt: Date.now() + 3_600_000,
                },
            },
            api: { baseUrl: crmServer.url.origin, version: 'v8' },
        })
    )
}

afterEach(async () => {
    crmServer?.stop(true)
    accountsServer?.stop(true)
    crmServer = null
    accountsServer = null
    lastPath = null

    if (projectPath) {
        await removeTempProject(projectPath)
        projectPath = null
    }
})

const delugeSource = 'string button.demo(String routeId)\n{\nreturn openUrl("x","parent window");\n}'

describe('getFunctionCode', () => {
    test('returns the Deluge source verbatim', async () => {
        await startProject(delugeSource)

        expect(await getFunctionCode('demo')).toBe(delugeSource)
        expect(lastPath).toBe('/crm/v8/settings/functions/demo/code')
    })

    test('keeps a body that looks like JSON as a string', async () => {
        await startProject('{"code":"SUCCESS"}', { contentType: 'application/json' })

        const code = await getFunctionCode('1000000000000012345')

        expect(typeof code).toBe('string')
        expect(code).toBe('{"code":"SUCCESS"}')
    })

    test('fails when the CRM answers with an error status', async () => {
        await startProject('not found', { status: 404 })

        await expect(getFunctionCode('missing')).rejects.toThrow(/404/)
    })
})
