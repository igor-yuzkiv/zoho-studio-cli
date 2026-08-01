import { afterEach, describe, expect, test } from 'bun:test'

import { getWorkflowActionsList, getWorkflowActionsPage } from '@/entities/workflow-action'

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

const deleteHook = { id: '1', name: 'Programs.Server.Delete', module: { api_name: 'Programs' } }
const createHook = { id: '2', name: 'Programs.Server.Create', module: { api_name: 'Programs' } }

describe('getWorkflowActionsPage', () => {
    test('reads the list out of the key Zoho names after the action type', async () => {
        await startProject(() => Response.json({ webhooks: [deleteHook], info: { more_records: true } }))

        const page = await getWorkflowActionsPage('webhooks', { per_page: 200, page: 3 })

        expect(page).toEqual({ workflowActions: [deleteHook], info: { more_records: true } })
        expect(requestedUrls[0]?.pathname).toEndWith('/settings/automation/webhooks')
        expect(requestedUrls[0]?.searchParams.get('page')).toBe('3')
        expect(requestedUrls[0]?.searchParams.get('module')).toBeNull()
        expect(requestedUrls).toHaveLength(1)
    })

    test('asks the endpoint of the type it was given', async () => {
        await startProject(() => Response.json({ email_notifications: [], info: {} }))

        await getWorkflowActionsPage('email_notifications', { per_page: 200, page: 1 })

        expect(requestedUrls[0]?.pathname).toEndWith('/settings/automation/email_notifications')
    })

    test('reads a no-content answer as an empty page', async () => {
        await startProject(() => new Response(null, { status: 204 }))

        expect(await getWorkflowActionsPage('tasks', { per_page: 200, page: 1 })).toEqual({
            workflowActions: [],
            info: {},
        })
    })
})

describe('getWorkflowActionsList', () => {
    test('concatenates every page while Zoho reports more records', async () => {
        await startProject((request) => {
            const page = new URL(request.url).searchParams.get('page')

            return page === '1'
                ? Response.json({ webhooks: [deleteHook], info: { more_records: true } })
                : Response.json({ webhooks: [createHook], info: { more_records: false } })
        })

        expect(await getWorkflowActionsList('webhooks')).toEqual([deleteHook, createHook])
        expect(requestedUrls.map((url) => url.searchParams.get('page'))).toEqual(['1', '2'])
    })

    test('narrows the request to one module when asked', async () => {
        await startProject(() => Response.json({ webhooks: [deleteHook], info: { more_records: false } }))

        expect(await getWorkflowActionsList('webhooks', 'Programs')).toEqual([deleteHook])
        expect(requestedUrls[0]?.searchParams.get('module')).toBe('Programs')
    })

    test('returns an empty list when Zoho answers with no content', async () => {
        await startProject(() => new Response(null, { status: 204 }))

        expect(await getWorkflowActionsList('field_updates')).toEqual([])
    })

    test('fails when the token has no scope for the endpoint', async () => {
        await startProject(() => Response.json({ code: 'OAUTH_SCOPE_MISMATCH' }, { status: 401 }))

        await expect(getWorkflowActionsList('tasks')).rejects.toThrow(/401/)
    })
})
