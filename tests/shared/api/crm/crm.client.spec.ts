import { afterEach, describe, expect, test } from 'bun:test'

import { getOrganization } from '@/entities/organization'

import { buildSettings, createTempProject, removeTempProject } from '../../../support/temp-project'

let projectPath: string | null = null
let crmServer: ReturnType<typeof Bun.serve> | null = null
let accountsServer: ReturnType<typeof Bun.serve> | null = null
let lastRequest: { path: string; authorization: string | null } | null = null

const validTokens = { accessToken: 'access', refreshToken: 'refresh', accessTokenExpiresAt: Date.now() + 3_600_000 }

async function startProject(crmAnswer: unknown, { status = 200, tokens = validTokens } = {}): Promise<void> {
    crmServer = Bun.serve({
        port: 0,
        fetch(request) {
            lastRequest = {
                path: new URL(request.url).pathname,
                authorization: request.headers.get('Authorization'),
            }

            return Response.json(crmAnswer, { status })
        },
    })

    accountsServer = Bun.serve({
        port: 0,
        fetch: () => Response.json({ access_token: 'fresh', expires_in: 3600, token_type: 'Bearer' }),
    })

    projectPath = await createTempProject(
        buildSettings({
            auth: { baseUrl: accountsServer.url.origin, tokens },
            api: { baseUrl: crmServer.url.origin, version: 'v8' },
        })
    )
}

afterEach(async () => {
    crmServer?.stop(true)
    accountsServer?.stop(true)
    crmServer = null
    accountsServer = null
    lastRequest = null

    if (projectPath) {
        await removeTempProject(projectPath)
        projectPath = null
    }
})

const organizationAnswer = { org: [{ company_name: 'Acme Inc', id: '77', primary_email: 'a@acme.test' }] }

describe('crmClient', () => {
    test('sends the stored access token and the versioned base path', async () => {
        await startProject(organizationAnswer)

        await getOrganization()

        expect(lastRequest).toEqual({ path: '/crm/v8/org', authorization: 'Zoho-oauthtoken access' })
    })

    test('refreshes the token before the request when the stored one expired', async () => {
        await startProject(organizationAnswer, {
            tokens: { ...validTokens, accessToken: 'stale', accessTokenExpiresAt: Date.now() - 1 },
        })

        await getOrganization()

        expect(lastRequest?.authorization).toBe('Zoho-oauthtoken fresh')
    })

    test('fails when the CRM answers with an error status', async () => {
        await startProject({ code: 'INVALID_TOKEN' }, { status: 401 })

        await expect(getOrganization()).rejects.toThrow(/401/)
    })
})
