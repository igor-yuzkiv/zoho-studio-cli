import { afterEach, describe, expect, test } from 'bun:test'

import { getWorkflowAction } from '@/entities/workflow-action'

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

const detailedWebhook = {
    id: '1',
    name: 'Contacts.Server.Upsert',
    module: { api_name: 'Contacts' },
    url: 'https://example.test/hooks/contacts/upsert',
    body: { raw_data_content: '{"id":"${!Contacts.id}"}' },
    headers: { module_parameters: null, custom_parameters: null },
}

describe('getWorkflowAction', () => {
    test('returns the single action Zoho wraps in a list under the type key', async () => {
        await startProject(() => Response.json({ webhooks: [detailedWebhook] }))

        expect(await getWorkflowAction('webhooks', '1')).toEqual(detailedWebhook)
        expect(requestedUrls[0]?.pathname).toEndWith('/settings/automation/webhooks/1')
    })

    test('asks the endpoint of the type it was given', async () => {
        await startProject(() => Response.json({ email_notifications: [{ id: '5', name: 'Alert' }] }))

        await getWorkflowAction('email_notifications', '5')

        expect(requestedUrls[0]?.pathname).toEndWith('/settings/automation/email_notifications/5')
    })

    test('reports an empty answer as no record rather than as an error', async () => {
        await startProject(() => new Response(null, { status: 204 }))

        expect(await getWorkflowAction('tasks', '404')).toBeNull()
    })

    test('still fails when the request itself is rejected', async () => {
        await startProject(() => Response.json({ code: 'OAUTH_SCOPE_MISMATCH' }, { status: 401 }))

        await expect(getWorkflowAction('tasks', '1')).rejects.toThrow(/401/)
    })
})
