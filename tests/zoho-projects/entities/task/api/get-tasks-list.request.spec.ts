import { afterEach, describe, expect, test } from 'bun:test'

import { getTasksList } from '@zoho-studio/zoho-projects'

import { listPage, startProjectsStub, type ProjectsStub } from '../../../../support/projects-stub'

let stub: ProjectsStub | null = null

afterEach(async () => {
    await stub?.stop()
    stub = null
})

const interview = {
    id: '31',
    name: 'Interview the owner',
    tasklist: { id: '21', name: 'Research' },
    milestone: { id: '11', name: 'Discovery' },
    last_modified_time: '2025-01-10T09:00:00.000Z',
}
const report = {
    id: '32',
    name: 'Write the report',
    tasklist: { id: '21', name: 'Research' },
    milestone: { id: '11', name: 'Discovery' },
    last_modified_time: '2025-01-12T09:00:00.000Z',
}

describe('getTasksList', () => {
    test('reads the tasks endpoint and returns the tasks of one page', async () => {
        stub = await startProjectsStub(() => listPage('tasks', [interview, report]))

        expect(await getTasksList()).toEqual([interview, report])
        expect(stub.requestedUrls[0]?.pathname).toBe('/api/v3/portal/100/projects/200/tasks')
        expect(stub.requestedUrls).toHaveLength(1)
    })

    test('concatenates every page while Zoho reports a next one', async () => {
        stub = await startProjectsStub((request) =>
            new URL(request.url).searchParams.get('page') === '1'
                ? listPage('tasks', [interview], { page: 1, hasNextPage: true })
                : listPage('tasks', [report], { page: 2 })
        )

        expect(await getTasksList()).toEqual([interview, report])
        expect(stub.requestedUrls.map((url) => url.searchParams.get('page'))).toEqual(['1', '2'])
    })

    test('returns an empty list when the project has no tasks', async () => {
        stub = await startProjectsStub(() => listPage('tasks', []))

        expect(await getTasksList()).toEqual([])
    })

    test('fails when Zoho answers with an error status', async () => {
        stub = await startProjectsStub(() => Response.json({ error: { code: 6403 } }, { status: 403 }))

        await expect(getTasksList()).rejects.toThrow(/403/)
    })
})
