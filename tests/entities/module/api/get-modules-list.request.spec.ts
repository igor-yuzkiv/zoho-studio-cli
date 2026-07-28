import { afterEach, describe, expect, test } from 'bun:test'

import { getModulesList } from '@/entities/module'

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

const leadsModule = { id: '1', api_name: 'Leads', module_name: 'Leads', generated_type: 'default' }
const customModule = { id: '2', api_name: 'CustomModule1', module_name: 'Projects', generated_type: 'custom' }

describe('getModulesList', () => {
    test('returns every module the endpoint answers with', async () => {
        await startProject(() => Response.json({ modules: [leadsModule, customModule] }))

        expect(await getModulesList()).toEqual([leadsModule, customModule])
        expect(requestedUrls).toHaveLength(1)
        expect(requestedUrls[0]?.pathname).toEndWith('/settings/modules')
    })

    test('returns an empty list when Zoho answers with no content', async () => {
        await startProject(() => new Response(null, { status: 204 }))

        expect(await getModulesList()).toEqual([])
    })

    test('fails when the request fails', async () => {
        await startProject(() => Response.json({ code: 'INTERNAL_ERROR' }, { status: 500 }))

        await expect(getModulesList()).rejects.toThrow(/500/)
    })
})
