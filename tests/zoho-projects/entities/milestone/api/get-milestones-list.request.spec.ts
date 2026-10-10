import { afterEach, describe, expect, test } from 'bun:test'

import { getMilestonesList } from '@zoho-studio/zoho-projects'

import { listPage, startProjectsStub, type ProjectsStub } from '../../../../support/projects-stub'

let stub: ProjectsStub | null = null

afterEach(async () => {
    await stub?.stop()
    stub = null
})

const discovery = { id: '11', name: 'Discovery', status_type: 'closed', last_modified_time: '2025-01-01T00:00:00.000Z' }
const delivery = { id: '12', name: 'Delivery', status_type: 'open', last_modified_time: '2025-02-01T00:00:00.000Z' }

describe('getMilestonesList', () => {
    test('reads the phases endpoint and returns the milestones of one page', async () => {
        stub = await startProjectsStub(() => listPage('milestones', [discovery, delivery]))

        expect(await getMilestonesList()).toEqual([discovery, delivery])
        expect(stub.requestedUrls[0]?.pathname).toBe('/api/v3/portal/100/projects/200/phases')
        expect(stub.requestedUrls[0]?.searchParams.get('per_page')).toBe('200')
        expect(stub.requestedUrls).toHaveLength(1)
    })

    test('concatenates every page while Zoho reports a next one', async () => {
        stub = await startProjectsStub((request) =>
            new URL(request.url).searchParams.get('page') === '1'
                ? listPage('milestones', [discovery], { page: 1, hasNextPage: true })
                : listPage('milestones', [delivery], { page: 2 })
        )

        expect(await getMilestonesList()).toEqual([discovery, delivery])
        expect(stub.requestedUrls.map((url) => url.searchParams.get('page'))).toEqual(['1', '2'])
    })

    test('returns an empty list when the project has no milestones', async () => {
        stub = await startProjectsStub(() => listPage('milestones', []))

        expect(await getMilestonesList()).toEqual([])
    })

    test('fails when Zoho answers with an error status', async () => {
        stub = await startProjectsStub(() => Response.json({ error: { code: 6401 } }, { status: 401 }))

        await expect(getMilestonesList()).rejects.toThrow(/401/)
    })
})
