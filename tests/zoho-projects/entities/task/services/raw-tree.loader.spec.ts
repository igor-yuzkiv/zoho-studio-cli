import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { loadRawTree } from '@zoho-studio/zoho-projects'

import { createTempProject, removeTempProject, writeRawFile } from '../../../../support/temp-project'

let projectPath: string

beforeEach(async () => {
    projectPath = await createTempProject()
})

afterEach(async () => {
    await removeTempProject(projectPath)
})

const discovery = { id: '11', name: 'Discovery', last_modified_time: '2025-01-01T00:00:00.000Z' }
const research = { id: '21', name: 'Research', milestone: { id: '11', name: 'Discovery' } }
const interview = {
    id: '31',
    name: 'Interview',
    tasklist: { id: '21', name: 'Research' },
    milestone: { id: '11', name: 'Discovery' },
    status: { name: 'Open', is_closed_type: false },
    last_modified_time: '2025-01-10T09:00:00.000Z',
}
const report = {
    id: '32',
    name: 'Report',
    tasklist: { id: '21', name: 'Research' },
    milestone: { id: '11', name: 'Discovery' },
    status: { name: 'Closed', is_closed_type: true },
    last_modified_time: '2025-01-12T09:00:00.000Z',
}
const comment = { id: '41', comment: '<p>Done</p>' }

describe('loadRawTree', () => {
    test('builds milestones, task lists, statuses and tasks with their comments', async () => {
        await writeRawFile(projectPath, 'Discovery/11.json', discovery)
        await writeRawFile(projectPath, 'Discovery/task-lists/Research/21.json', research)
        await writeRawFile(projectPath, 'Discovery/task-lists/Research/tasks/Interview/31.json', interview)
        await writeRawFile(projectPath, 'Discovery/task-lists/Research/tasks/Interview/31.comments.json', [comment])
        await writeRawFile(projectPath, 'Discovery/task-lists/Research/tasks/Report/32.json', report)
        await writeRawFile(projectPath, 'Discovery/task-lists/Research/tasks/Report/32.comments.json', [])

        const tree = await loadRawTree(projectPath)

        expect(tree.skippedFiles).toEqual([])
        expect(tree.milestones).toHaveLength(1)
        const [milestone] = tree.milestones
        expect(milestone).toMatchObject({ id: '11', name: 'Discovery', record: discovery })
        expect(milestone!.taskLists).toHaveLength(1)
        const [taskList] = milestone!.taskLists
        expect(taskList).toMatchObject({ id: '21', name: 'Research', milestoneId: '11', record: research })
        expect(taskList!.statuses.map((status) => [status.name, status.isClosed])).toEqual([
            ['Open', false],
            ['Closed', true],
        ])
        expect(taskList!.statuses[0]!.tasks).toEqual([{ record: interview, comments: [comment] }])
        expect(taskList!.statuses[1]!.tasks).toEqual([{ record: report, comments: [] }])
    })

    test('keeps one copy of a task found in two folders — the later modified one', async () => {
        const renamed = { ...interview, name: 'Interview the owner', last_modified_time: '2025-02-01T00:00:00.000Z' }
        await writeRawFile(projectPath, 'Discovery/task-lists/Research/tasks/Interview/31.json', interview)
        await writeRawFile(projectPath, 'Discovery/task-lists/Research/tasks/Interview the owner/31.json', renamed)

        const tree = await loadRawTree(projectPath)
        const tasks = tree.milestones[0]!.taskLists[0]!.statuses[0]!.tasks

        expect(tasks.map((task) => task.record.name)).toEqual(['Interview the owner'])
    })

    test('names a parent from the task when its own JSON was never pulled', async () => {
        await writeRawFile(projectPath, 'Discovery/task-lists/Research/tasks/Interview/31.json', interview)

        const tree = await loadRawTree(projectPath)

        expect(tree.milestones[0]).toMatchObject({ id: '11', name: 'Discovery', record: null })
        expect(tree.milestones[0]!.taskLists[0]).toMatchObject({ id: '21', name: 'Research', record: null })
    })

    test('puts a task without a task list under _no-task-list and without a milestone under _no-milestone', async () => {
        const loose = { ...interview, id: '33', tasklist: undefined }
        const lost = { ...interview, id: '34', tasklist: undefined, milestone: undefined }
        await writeRawFile(projectPath, 'Discovery/task-lists/_no-task-list/tasks/Loose/33.json', loose)
        await writeRawFile(projectPath, '_no-milestone/task-lists/_no-task-list/tasks/Lost/34.json', lost)

        const tree = await loadRawTree(projectPath)

        expect(tree.milestones.map((milestone) => milestone.id)).toEqual(['11', '_no-milestone'])
        expect(tree.milestones[0]!.taskLists[0]).toMatchObject({ name: '_no-task-list', milestoneId: '11' })
        expect(tree.milestones[1]!.taskLists[0]).toMatchObject({ name: '_no-task-list', milestoneId: '_no-milestone' })
    })

    test('lists a milestone and a task list that have no tasks yet', async () => {
        await writeRawFile(projectPath, 'Discovery/11.json', discovery)
        await writeRawFile(projectPath, 'Discovery/task-lists/Research/21.json', research)

        const tree = await loadRawTree(projectPath)

        expect(tree.milestones[0]!.taskLists[0]).toMatchObject({ id: '21', statuses: [] })
    })

    test('skips a file that is not JSON, flags it and keeps the rest', async () => {
        await writeRawFile(projectPath, 'Discovery/task-lists/Research/tasks/Interview/31.json', interview)
        await writeRawFile(projectPath, 'Discovery/task-lists/Research/tasks/Report/32.json', '{ broken')

        const tree = await loadRawTree(projectPath)

        expect(tree.skippedFiles).toEqual([
            join(projectPath, 'src/zoho-projects/raw/Discovery/task-lists/Research/tasks/Report/32.json'),
        ])
        expect(tree.milestones[0]!.taskLists[0]!.statuses[0]!.tasks.map((task) => task.record.id)).toEqual(['31'])
    })

    test('returns an empty tree for a missing or empty raw folder', async () => {
        expect(await loadRawTree(projectPath)).toEqual({
            milestones: [],
            tasksById: new Map(),
            projectName: null,
            skippedFiles: [],
        })
    })
})
