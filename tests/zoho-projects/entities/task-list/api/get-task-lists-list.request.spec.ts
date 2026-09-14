import { afterEach, describe, expect, test } from 'bun:test'

import { getTaskListsList } from '@/zoho-projects/entities/task-list'

import { listPage, startProjectsStub, type ProjectsStub } from '../../../../support/projects-stub'

let stub: ProjectsStub | null = null

afterEach(async () => {
    await stub?.stop()
    stub = null
})

const research = {
    id: '21',
    name: 'Research',
    milestone: { id: '11', name: 'Discovery' },
    meta_info: { is_none_milestone_tasklist: false },
}
const general = {
    id: '22',
    name: 'General',
    milestone: { id: '1', name: 'None' },
    meta_info: { is_none_milestone_tasklist: true },
}

describe('getTaskListsList', () => {
    test('reads the tasklists endpoint and returns the task lists of one page', async () => {
        stub = await startProjectsStub(() => listPage('tasklists', [research, general]))

        expect(await getTaskListsList()).toEqual([research, general])
        expect(stub.requestedUrls[0]?.pathname).toBe('/api/v3/portal/100/projects/200/tasklists')
        expect(stub.requestedUrls).toHaveLength(1)
    })

    test('concatenates every page while Zoho reports a next one', async () => {
        stub = await startProjectsStub((request) =>
            new URL(request.url).searchParams.get('page') === '1'
                ? listPage('tasklists', [research], { page: 1, hasNextPage: true })
                : listPage('tasklists', [general], { page: 2 })
        )

        expect(await getTaskListsList()).toEqual([research, general])
        expect(stub.requestedUrls.map((url) => url.searchParams.get('page'))).toEqual(['1', '2'])
    })

    test('returns an empty list when the project has no task lists', async () => {
        stub = await startProjectsStub(() => listPage('tasklists', []))

        expect(await getTaskListsList()).toEqual([])
    })

    test('fails when Zoho answers with an error status', async () => {
        stub = await startProjectsStub(() => Response.json({ error: { code: 6500 } }, { status: 500 }))

        await expect(getTaskListsList()).rejects.toThrow(/500/)
    })
})
