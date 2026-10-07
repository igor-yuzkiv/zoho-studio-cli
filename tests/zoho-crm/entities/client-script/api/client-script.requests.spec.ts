import { afterEach, describe, expect, test } from 'bun:test'

import {
    getClientScriptPagesList,
    getClientScriptSource,
    getClientScriptsList,
} from '@/zoho-crm/entities/client-script'

import { buildSettings, createTempProject, removeTempProject } from '../../../../support/temp-project'

let projectPath: string | null = null
let crmServer: ReturnType<typeof Bun.serve> | null = null
let accountsServer: ReturnType<typeof Bun.serve> | null = null
let lastUrl: URL | null = null
let lastAuthorization: string | null = null

async function startProject(respond: () => Response): Promise<void> {
    crmServer = Bun.serve({
        port: 0,
        fetch(request) {
            lastUrl = new URL(request.url)
            lastAuthorization = request.headers.get('authorization')

            return respond()
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
    lastUrl = null
    lastAuthorization = null

    if (projectPath) {
        await removeTempProject(projectPath)
        projectPath = null
    }
})

describe('getClientScriptPagesList', () => {
    test('returns the pages of the organization', async () => {
        await startProject(() => Response.json({ client_script_pages: [{ id: '1', definition: 'commands' }] }))

        expect(await getClientScriptPagesList()).toEqual([{ id: '1', definition: 'commands' }])
        expect(lastUrl?.pathname).toBe('/crm/v8/settings/client_script_pages')
    })

    test('treats an empty answer as no pages', async () => {
        await startProject(() => new Response(null, { status: 204 }))

        expect(await getClientScriptPagesList()).toEqual([])
    })
})

describe('getClientScriptsList', () => {
    test('asks for the scripts of one page', async () => {
        await startProject(() => Response.json({ client_scripts: [{ id: '7', name: 'Generate UUID' }] }))

        expect(await getClientScriptsList('1')).toEqual([{ id: '7', name: 'Generate UUID' }])

        expect(lastUrl?.pathname).toBe('/crm/v8/settings/client_scripts')
        expect(lastUrl?.searchParams.get('client_script_page_id')).toBe('1')
    })
})

describe('getClientScriptSource', () => {
    test('returns the source verbatim and sends no token', async () => {
        const source = 'const field = ZDK.Page.getField("Contact_Name");\n'
        await startProject(() => new Response(source, { headers: { 'Content-Type': 'application/javascript' } }))

        expect(await getClientScriptSource(`${crmServer!.url.origin}/appfiles/script.js`)).toBe(source)
        expect(lastAuthorization).toBeNull()
    })

    test('fails when the hosting answers with an error status', async () => {
        await startProject(() => new Response('gone', { status: 404 }))

        await expect(getClientScriptSource(`${crmServer!.url.origin}/missing.js`)).rejects.toThrow(/404/)
    })
})
