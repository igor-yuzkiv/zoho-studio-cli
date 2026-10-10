import { afterEach, describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { pullMilestonesCommand } from '@/zoho-projects/commands/milestones'
import { pullTaskListsCommand } from '@/zoho-projects/commands/task-lists'

import { answerProjectsLists, readRawDirs, startProjectsStub, type ProjectsStub } from '../../../support/projects-stub'

let stub: ProjectsStub | null = null

afterEach(async () => {
    await stub?.stop()
    stub = null
    process.exitCode = 0
})

const discovery = { id: '11', name: 'Discovery' }
const delivery = { id: '12', name: 'Delivery' }
const research = { id: '21', name: 'Research', milestone: { id: '11', name: 'Discovery' } }
const rollout = { id: '22', name: 'Rollout', milestone: { id: '12', name: 'Delivery' } }
const general = {
    id: '23',
    name: 'General',
    milestone: { id: '1', name: 'None' },
    meta_info: { is_none_milestone_tasklist: true },
}
const orphan = { id: '24', name: 'Orphan', milestone: { id: '99', name: 'Gone' } }

describe('z-projects:task-lists:pull', () => {
    test('writes a task list under the milestone folder an earlier pull created', async () => {
        stub = await startProjectsStub(answerProjectsLists({ milestones: [discovery], taskLists: [research] }))
        await pullMilestonesCommand.parseAsync([], { from: 'user' })

        await pullTaskListsCommand.parseAsync([], { from: 'user' })

        expect(await readRawDirs(stub.projectPath, 'Discovery/task-lists')).toEqual(['Research'])
        expect(
            await Bun.file(join(stub.projectPath, 'src/zoho-projects/raw/Discovery/task-lists/Research/21.json')).json()
        ).toEqual(research)
        expect(stub.requestedUrls.filter((url) => url.pathname.endsWith('/phases'))).toHaveLength(1)
    })

    test('fetches and writes a milestone that is not local yet', async () => {
        stub = await startProjectsStub(
            answerProjectsLists({ milestones: [discovery, delivery], taskLists: [research, rollout] })
        )

        await pullTaskListsCommand.parseAsync([], { from: 'user' })

        expect(await readRawDirs(stub.projectPath, '.')).toEqual(['Delivery', 'Discovery'])
        expect(await Bun.file(join(stub.projectPath, 'src/zoho-projects/raw/Delivery/12.json')).json()).toEqual(
            delivery
        )
        expect(await readRawDirs(stub.projectPath, 'Delivery/task-lists')).toEqual(['Rollout'])
        expect(stub.requestedUrls.filter((url) => url.pathname.endsWith('/phases'))).toHaveLength(1)
    })

    test('puts a task list outside any milestone under _no-milestone', async () => {
        stub = await startProjectsStub(answerProjectsLists({ milestones: [], taskLists: [general] }))

        await pullTaskListsCommand.parseAsync([], { from: 'user' })

        expect(await readRawDirs(stub.projectPath, '_no-milestone/task-lists')).toEqual(['General'])
        expect(stub.requestedUrls.filter((url) => url.pathname.endsWith('/phases'))).toHaveLength(0)
    })

    test('skips a task list whose milestone cannot be found, writes the rest and exits non-zero', async () => {
        stub = await startProjectsStub(answerProjectsLists({ milestones: [discovery], taskLists: [orphan, research] }))

        await pullTaskListsCommand.parseAsync([], { from: 'user' })

        expect(await readRawDirs(stub.projectPath, '.')).toEqual(['Discovery'])
        expect(await readRawDirs(stub.projectPath, 'Discovery/task-lists')).toEqual(['Research'])
        expect(process.exitCode).toBe(1)
    })

    test('leaves raw untouched when the list request fails', async () => {
        stub = await startProjectsStub(() => Response.json({ error: { code: 6401 } }, { status: 401 }))

        await expect(pullTaskListsCommand.parseAsync([], { from: 'user' })).rejects.toThrow(/401/)
        expect(await readRawDirs(stub.projectPath, '.')).toEqual([])
    })
})
