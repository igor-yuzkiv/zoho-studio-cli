import { afterEach, describe, expect, test } from 'bun:test'

import { getStaticResourceContent, getStaticResourcesList } from '@/zoho-crm/entities/static-resource'

import { buildSettings, createTempProject, removeTempProject } from '../../../../support/temp-project'

let projectPath: string | null = null
let crmServer: ReturnType<typeof Bun.serve> | null = null
let accountsServer: ReturnType<typeof Bun.serve> | null = null
let requestedUrls: URL[] = []
let lastAuthorization: string | null = null

async function startProject(respond: (url: URL) => Response): Promise<void> {
    crmServer = Bun.serve({
        port: 0,
        fetch(request) {
            const url = new URL(request.url)

            requestedUrls.push(url)
            lastAuthorization = request.headers.get('authorization')

            return respond(url)
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
    requestedUrls = []
    lastAuthorization = null

    if (projectPath) {
        await removeTempProject(projectPath)
        projectPath = null
    }
})

describe('getStaticResourcesList', () => {
    test('follows the pages while Zoho reports more records', async () => {
        await startProject((url) => {
            const page = Number(url.searchParams.get('page'))

            return Response.json({
                static_resources: [{ id: String(page), name: `resource ${page}` }],
                info: { more_records: page < 2 },
            })
        })

        const resources = await getStaticResourcesList()

        expect(resources.map((resource) => resource.id)).toEqual(['1', '2'])
        expect(requestedUrls[0]?.pathname).toBe('/crm/v8/settings/static_resources')
        expect(requestedUrls[0]?.searchParams.get('per_page')).toBe('200')
    })

    test('treats an empty answer as no resources', async () => {
        await startProject(() => new Response(null, { status: 204 }))

        expect(await getStaticResourcesList()).toEqual([])
    })
})

describe('getStaticResourceContent', () => {
    test('returns the bytes unchanged and sends no token', async () => {
        const bytes = new Uint8Array([0x1f, 0x8b, 0x08, 0x00, 0xff])
        await startProject(() => new Response(bytes, { headers: { 'Content-Type': 'application/octet-stream' } }))

        expect(await getStaticResourceContent(`${crmServer!.url.origin}/sdk.js.gzip`)).toEqual(bytes)
        expect(lastAuthorization).toBeNull()
    })

    test('fails when the file host answers with an error status', async () => {
        await startProject(() => new Response('gone', { status: 404 }))

        await expect(getStaticResourceContent(`${crmServer!.url.origin}/missing.js`)).rejects.toThrow(/404/)
    })
})
