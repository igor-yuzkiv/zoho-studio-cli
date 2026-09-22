import { afterEach, describe, expect, test } from 'bun:test'

import { getIssuesList } from '@/zoho-projects/entities/issue'

import { listPage, startProjectsStub, type ProjectsStub } from '../../../../support/projects-stub'

let stub: ProjectsStub | null = null

afterEach(async () => {
    await stub?.stop()
    stub = null
})

const timeout = { id: '51', prefix: 'QA7-I1', name: 'Login timeout' }
const escalation = { id: '52', prefix: 'QA7-I2', name: 'Broken export' }

describe('getIssuesList', () => {
    test('reads the issues endpoint and returns the issues of one page', async () => {
        stub = await startProjectsStub(() => listPage('issues', [timeout, escalation]))

        expect(await getIssuesList()).toEqual([timeout, escalation])
        expect(stub.requestedUrls[0]?.pathname).toBe('/api/v3/portal/100/projects/200/issues')
        expect(stub.requestedUrls).toHaveLength(1)
    })

    test('concatenates every page while Zoho reports a next one', async () => {
        stub = await startProjectsStub((request) =>
            new URL(request.url).searchParams.get('page') === '1'
                ? listPage('issues', [timeout], { page: 1, hasNextPage: true })
                : listPage('issues', [escalation], { page: 2 })
        )

        expect(await getIssuesList()).toEqual([timeout, escalation])
        expect(stub.requestedUrls.map((url) => url.searchParams.get('page'))).toEqual(['1', '2'])
    })

    test('fails when Zoho answers with an error status', async () => {
        stub = await startProjectsStub(() => Response.json({ error: { code: 6403 } }, { status: 403 }))

        await expect(getIssuesList()).rejects.toThrow(/403/)
    })
})
