import { afterEach, describe, expect, test } from 'bun:test'

import { getWorkflowRule } from '@/entities/workflow-rule'

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

const detailedRule = {
    id: '1',
    name: 'Big Deal Rule',
    module: { api_name: 'Deals' },
    conditions: [{ id: '75', instant_actions: { actions: [{ type: 'email_notifications' }] } }],
}

describe('getWorkflowRule', () => {
    test('returns the single rule Zoho wraps in a list', async () => {
        await startProject(() => Response.json({ workflow_rules: [detailedRule] }))

        expect(await getWorkflowRule('1')).toEqual(detailedRule)
        expect(requestedUrls[0]?.pathname).toEndWith('/settings/automation/workflow_rules/1')
    })

    test('fails on the empty answer Zoho gives for an unknown id', async () => {
        await startProject(() => new Response(null, { status: 204 }))

        await expect(getWorkflowRule('404')).rejects.toThrow(/no workflow rule for id "404"/)
    })
})
