import { afterEach, describe, expect, test } from 'bun:test'

import { projectsClient } from '@/shared/api/projects'

import { startProjectsStub, type ProjectsStub } from '../../../support/projects-stub'

let stub: ProjectsStub | null = null

afterEach(async () => {
    await stub?.stop()
    stub = null
})

const phasesAnswer = (): Response => Response.json({ phases: [] })

describe('projectsClient', () => {
    test('builds the base path from the portal and the project and sends the stored token', async () => {
        stub = await startProjectsStub(phasesAnswer)

        await projectsClient.get('phases')

        expect(stub.requestedUrls.map((url) => url.pathname)).toEqual(['/api/v3/portal/100/projects/200/phases'])
        expect(stub.authorizations).toEqual(['Zoho-oauthtoken access'])
    })

    test('sends the token of a separate Projects connection when there is one', async () => {
        stub = await startProjectsStub(phasesAnswer, {
            projectsTokens: {
                accessToken: 'projects',
                refreshToken: 'r',
                accessTokenExpiresAt: Date.now() + 3_600_000,
            },
        })

        await projectsClient.get('phases')

        expect(stub.authorizations).toEqual(['Zoho-oauthtoken projects'])
    })

    test('refreshes the token before the request when the stored one expired', async () => {
        stub = await startProjectsStub(phasesAnswer, {
            tokens: { accessToken: 'stale', accessTokenExpiresAt: Date.now() - 1 },
        })

        await projectsClient.get('phases')

        expect(stub.authorizations).toEqual(['Zoho-oauthtoken fresh'])
    })

    test('stops before any request when the portal id is empty', async () => {
        stub = await startProjectsStub(phasesAnswer, { projects: { portalId: '' } })

        await expect(projectsClient.get('phases')).rejects.toThrow('projects.portalId is empty')
        expect(stub.requestedUrls).toEqual([])
    })

    test('stops before any request when the project id is empty', async () => {
        stub = await startProjectsStub(phasesAnswer, { projects: { projectId: '' } })

        await expect(projectsClient.get('phases')).rejects.toThrow('projects.projectId is empty')
        expect(stub.requestedUrls).toEqual([])
    })

    test('waits for Retry-After and repeats the request once when Zoho throttles it', async () => {
        let answered = 0
        stub = await startProjectsStub(() => (answered++ === 0 ? throttledAnswer() : phasesAnswer()))

        const startedAt = Date.now()
        const response = await projectsClient.get('phases')

        expect(response.status).toBe(200)
        expect(stub.requestedUrls).toHaveLength(2)
        expect(Date.now() - startedAt).toBeGreaterThanOrEqual(1000)
    })

    test('gives up after one throttled retry', async () => {
        stub = await startProjectsStub(throttledAnswer)

        await expect(projectsClient.get('phases')).rejects.toThrow(/400/)
        expect(stub.requestedUrls).toHaveLength(2)
    })
})

function throttledAnswer(): Response {
    return Response.json(
        { error: { title: 'URL_ROLLING_THROTTLES_LIMIT_EXCEEDED', status_code: '400' } },
        { status: 400, headers: { 'Retry-After': '1' } }
    )
}
