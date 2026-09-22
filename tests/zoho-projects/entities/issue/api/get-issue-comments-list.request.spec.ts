import { afterEach, describe, expect, test } from 'bun:test'

import { getIssueCommentsList } from '@/zoho-projects/entities/issue'

import { listPage, startProjectsStub, type ProjectsStub } from '../../../../support/projects-stub'

let stub: ProjectsStub | null = null

afterEach(async () => {
    await stub?.stop()
    stub = null
})

const comment = { id: '61', comment: '<div>Fixed</div>', added_by: { full_name: 'Olena' } }

describe('getIssueCommentsList', () => {
    test('reads the comments of one issue from the bugs endpoint', async () => {
        stub = await startProjectsStub(() => listPage('comments', [comment]))

        expect(await getIssueCommentsList('51')).toEqual([comment])
        expect(stub.requestedUrls[0]?.pathname).toBe('/api/v3/portal/100/projects/200/bugs/51/comments')
    })

    test('returns an empty list for an issue without comments', async () => {
        stub = await startProjectsStub(() => listPage('comments', []))

        expect(await getIssueCommentsList('51')).toEqual([])
    })
})
