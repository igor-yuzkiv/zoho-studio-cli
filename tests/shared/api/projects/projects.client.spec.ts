import { afterEach, describe, expect, test } from 'bun:test'

import { projectsClient } from '@/shared/api/projects'

import { buildSettings, createTempProject, removeTempProject } from '../../../support/temp-project'

let projectPath: string | null = null
let projectsServer: ReturnType<typeof Bun.serve> | null = null
let accountsServer: ReturnType<typeof Bun.serve> | null = null
let requests: { path: string; authorization: string | null }[] = []

const validTokens = { accessToken: 'access', refreshToken: 'refresh', accessTokenExpiresAt: Date.now() + 3_600_000 }

async function startProject({ tokens = validTokens, portalId = '100', projectId = '200' } = {}): Promise<void> {
    projectsServer = Bun.serve({
        port: 0,
        fetch(request) {
            requests.push({
                path: new URL(request.url).pathname,
                authorization: request.headers.get('Authorization'),
            })

            return Response.json({ phases: [] })
        },
    })

    accountsServer = Bun.serve({
        port: 0,
        fetch: () => Response.json({ access_token: 'fresh', expires_in: 3600, token_type: 'Bearer' }),
    })

    projectPath = await createTempProject(
        buildSettings({
            auth: { baseUrl: accountsServer.url.origin, tokens },
            projects: { baseUrl: projectsServer.url.origin, portalId, projectId },
        })
    )
}

afterEach(async () => {
    projectsServer?.stop(true)
    accountsServer?.stop(true)
    projectsServer = null
    accountsServer = null
    requests = []

    if (projectPath) {
        await removeTempProject(projectPath)
        projectPath = null
    }
})

describe('projectsClient', () => {
    test('builds the base path from the portal and the project and sends the stored token', async () => {
        await startProject()

        await projectsClient.get('phases')

        expect(requests).toEqual([{ path: '/api/v3/portal/100/projects/200/phases', authorization: 'Zoho-oauthtoken access' }])
    })

    test('refreshes the token before the request when the stored one expired', async () => {
        await startProject({ tokens: { ...validTokens, accessToken: 'stale', accessTokenExpiresAt: Date.now() - 1 } })

        await projectsClient.get('phases')

        expect(requests[0]?.authorization).toBe('Zoho-oauthtoken fresh')
    })

    test('stops before any request when the portal id is empty', async () => {
        await startProject({ portalId: '' })

        await expect(projectsClient.get('phases')).rejects.toThrow('projects.portalId is empty')
        expect(requests).toEqual([])
    })

    test('stops before any request when the project id is empty', async () => {
        await startProject({ projectId: '' })

        await expect(projectsClient.get('phases')).rejects.toThrow('projects.projectId is empty')
        expect(requests).toEqual([])
    })
})
