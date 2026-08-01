import { afterEach, describe, expect, test } from 'bun:test'

import { getWebhooksList, getWebhooksPage } from '@/entities/webhook'

import { buildSettings, createTempProject, removeTempProject } from '../../../support/temp-project'

let projectPath: string | null = null
let crmServer: ReturnType<typeof Bun.serve> | null = null
let accountsServer: ReturnType<typeof Bun.serve> | null = null
let requestedUrls: URL[] = []

async function startProject(answer: (request: Request) => Response): Promise<void> {
    crmServer = Bun.serve({
        port: 0,
        fetch(request) {
            requestedUrls.push(new URL(request.url))

            return answer(request)
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

    if (projectPath) {
        await removeTempProject(projectPath)
        projectPath = null
    }
})

const deleteHook = { id: '1', name: 'SRV.Programs.Delete', module: { api_name: 'Programs' } }
const upsertHook = { id: '2', name: 'SRV.Programs.Upsert', module: { api_name: 'Programs' } }

describe('getWebhooksPage', () => {
    test('requests the asked page and returns it with its pagination info', async () => {
        await startProject(() => Response.json({ webhooks: [deleteHook], info: { more_records: true } }))

        const page = await getWebhooksPage({ per_page: 200, page: 3 })

        expect(page).toEqual({ webhooks: [deleteHook], info: { more_records: true } })
        expect(requestedUrls[0]?.pathname).toEndWith('/settings/automation/webhooks')
        expect(requestedUrls[0]?.searchParams.get('page')).toBe('3')
        expect(requestedUrls).toHaveLength(1)
    })

    test('reads a no-content answer as an empty page', async () => {
        await startProject(() => new Response(null, { status: 204 }))

        expect(await getWebhooksPage({ per_page: 200, page: 1 })).toEqual({ webhooks: [], info: {} })
    })
})

describe('getWebhooksList', () => {
    test('concatenates every page while Zoho reports more records', async () => {
        await startProject((request) => {
            const page = new URL(request.url).searchParams.get('page')

            return page === '1'
                ? Response.json({ webhooks: [deleteHook], info: { more_records: true } })
                : Response.json({ webhooks: [upsertHook], info: { more_records: false } })
        })

        expect(await getWebhooksList()).toEqual([deleteHook, upsertHook])
        expect(requestedUrls.map((url) => url.searchParams.get('page'))).toEqual(['1', '2'])
    })

    test('returns an empty list when Zoho answers with no content', async () => {
        await startProject(() => new Response(null, { status: 204 }))

        expect(await getWebhooksList()).toEqual([])
    })

    test('fails when Zoho rejects the request', async () => {
        await startProject(() => Response.json({ code: 'OAUTH_SCOPE_MISMATCH' }, { status: 401 }))

        await expect(getWebhooksList()).rejects.toThrow(/401/)
    })
})
