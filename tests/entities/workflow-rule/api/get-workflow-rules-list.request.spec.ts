import { afterEach, describe, expect, test } from 'bun:test'

import { getWorkflowRulesList, getWorkflowRulesPage } from '@/entities/workflow-rule'

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

const bigDealRule = { id: '1', name: 'Big Deal Rule', module: { api_name: 'Deals' } }
const welcomeRule = { id: '2', name: 'Send Welcome Email', module: { api_name: 'Leads' } }

describe('getWorkflowRulesPage', () => {
    test('requests the asked page and returns it with its pagination info', async () => {
        await startProject(() => Response.json({ workflow_rules: [bigDealRule], info: { more_records: true } }))

        const page = await getWorkflowRulesPage({ per_page: 200, page: 3 })

        expect(page).toEqual({ workflowRules: [bigDealRule], info: { more_records: true } })
        expect(requestedUrls[0]?.pathname).toEndWith('/settings/automation/workflow_rules')
        expect(requestedUrls[0]?.searchParams.get('page')).toBe('3')
        expect(requestedUrls[0]?.searchParams.get('module')).toBeNull()
        expect(requestedUrls).toHaveLength(1)
    })

    test('reads a no-content answer as an empty page', async () => {
        await startProject(() => new Response(null, { status: 204 }))

        expect(await getWorkflowRulesPage({ per_page: 200, page: 1 })).toEqual({ workflowRules: [], info: {} })
    })
})

describe('getWorkflowRulesList', () => {
    test('concatenates every page while Zoho reports more records', async () => {
        await startProject((request) => {
            const page = new URL(request.url).searchParams.get('page')

            return page === '1'
                ? Response.json({ workflow_rules: [bigDealRule], info: { more_records: true } })
                : Response.json({ workflow_rules: [welcomeRule], info: { more_records: false } })
        })

        expect(await getWorkflowRulesList()).toEqual([bigDealRule, welcomeRule])
        expect(requestedUrls.map((url) => url.searchParams.get('page'))).toEqual(['1', '2'])
    })

    test('narrows the request to one module when asked', async () => {
        await startProject(() => Response.json({ workflow_rules: [bigDealRule], info: { more_records: false } }))

        expect(await getWorkflowRulesList('Deals')).toEqual([bigDealRule])
        expect(requestedUrls[0]?.searchParams.get('module')).toBe('Deals')
    })

    test('returns an empty list when Zoho answers with no content', async () => {
        await startProject(() => new Response(null, { status: 204 }))

        expect(await getWorkflowRulesList()).toEqual([])
    })

    test('fails when a module is not available', async () => {
        await startProject(() => Response.json({ code: 'INVALID_MODULE' }, { status: 400 }))

        await expect(getWorkflowRulesList('Ghost')).rejects.toThrow(/400/)
    })
})
