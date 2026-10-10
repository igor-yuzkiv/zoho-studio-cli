import { afterEach, describe, expect, test } from 'bun:test'

import { getTaskCommentsList } from '@zoho-studio/zoho-projects'

import { listPage, startProjectsStub, type ProjectsStub } from '../../../../support/projects-stub'

let stub: ProjectsStub | null = null

afterEach(async () => {
    await stub?.stop()
    stub = null
})

const first = { id: '41', comment: 'Looks good', added_via: 'web', created_time: '2025-01-10T10:00:00.000Z' }
const second = { id: '42', comment: 'Shipped', added_via: 'web', created_time: '2025-01-11T10:00:00.000Z' }

describe('getTaskCommentsList', () => {
    test('reads the comments of the asked task', async () => {
        stub = await startProjectsStub(() => listPage('comments', [first, second]))

        expect(await getTaskCommentsList('31')).toEqual([first, second])
        expect(stub.requestedUrls[0]?.pathname).toBe('/api/v3/portal/100/projects/200/tasks/31/comments')
        expect(stub.requestedUrls).toHaveLength(1)
    })

    test('concatenates every page while Zoho reports a next one', async () => {
        stub = await startProjectsStub((request) =>
            new URL(request.url).searchParams.get('page') === '1'
                ? listPage('comments', [first], { page: 1, hasNextPage: true })
                : listPage('comments', [second], { page: 2 })
        )

        expect(await getTaskCommentsList('31')).toEqual([first, second])
    })

    test('returns an empty list for a task without comments', async () => {
        stub = await startProjectsStub(() => listPage('comments', []))

        expect(await getTaskCommentsList('31')).toEqual([])
    })

    test('fails when Zoho answers with an error status', async () => {
        stub = await startProjectsStub(() => Response.json({ error: { code: 6404 } }, { status: 404 }))

        await expect(getTaskCommentsList('ghost')).rejects.toThrow(/404/)
    })
})
