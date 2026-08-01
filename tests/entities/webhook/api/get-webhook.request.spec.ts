import { afterEach, describe, expect, test } from 'bun:test'

import { getWebhook } from '@/entities/webhook'

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
    name: 'SRV.Programs.Delete',
    module: { api_name: 'Programs' },
    url: 'https://example.test/hooks/Programs/delete',
    http_method: 'POST',
    body: { raw_data_content: '{"id":"${!Programs.id}"}', format: 'JSON', type: 'raw' },
    authentication: { connection_name: 'backendserver', type: 'connection' },
}

describe('getWebhook', () => {
    test('returns the single webhook Zoho wraps in a list', async () => {
        await startProject(() => Response.json({ webhooks: [detailedWebhook] }))

        expect(await getWebhook('1')).toEqual(detailedWebhook)
        expect(requestedUrls[0]?.pathname).toEndWith('/settings/automation/webhooks/1')
    })

    test('fails on the empty answer Zoho gives for an unknown id', async () => {
        await startProject(() => new Response(null, { status: 204 }))

        await expect(getWebhook('404')).rejects.toThrow(/no webhook for id "404"/)
    })
})
