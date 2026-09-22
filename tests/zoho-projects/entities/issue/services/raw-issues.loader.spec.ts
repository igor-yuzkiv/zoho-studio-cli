import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { loadRawIssues } from '@/zoho-projects/entities/issue'
import { loadRawTree } from '@/zoho-projects/entities/task'

import { createTempProject, removeTempProject, writeRawFile } from '../../../../support/temp-project'

let projectPath: string

beforeEach(async () => {
    projectPath = await createTempProject()
})

afterEach(async () => {
    await removeTempProject(projectPath)
})

const open = {
    id: '51',
    prefix: 'QA7-I51',
    name: 'Timeout',
    project: { id: '200', name: 'Acme' },
    status: { name: 'Open', is_closed_type: false },
    last_updated_time: '2026-03-02T11:30:00.000Z',
}
const closed = {
    id: '52',
    prefix: 'QA7-I52',
    name: 'Broken export',
    status: { name: 'Closed', is_closed_type: true },
    last_updated_time: '2026-03-09T16:45:00.000Z',
}
const later = { id: '53', prefix: 'QA7-I9', name: 'Old one', status: { name: 'Open', is_closed_type: false } }
const comment = { id: '61', comment: '<p>Done</p>' }

describe('loadRawIssues', () => {
    test('reads every issue with its comments, open statuses first, then by prefix number', async () => {
        await writeRawFile(projectPath, 'issues/Broken export/52.json', closed)
        await writeRawFile(projectPath, 'issues/Broken export/52.comments.json', [comment])
        await writeRawFile(projectPath, 'issues/Timeout/51.json', open)
        await writeRawFile(projectPath, 'issues/Timeout/51.comments.json', [])
        await writeRawFile(projectPath, 'issues/Old one/53.json', later)

        const raw = await loadRawIssues(projectPath)

        expect(raw.skippedFiles).toEqual([])
        expect(raw.projectName).toBe('Acme')
        expect(raw.issues.map((issue) => issue.record.id)).toEqual(['53', '51', '52'])
        expect(raw.issuesById.get('52')).toEqual({ record: closed, comments: [comment] })
        expect(raw.issuesById.get('53')).toEqual({ record: later, comments: [] })
    })

    test('keeps the later record when the same issue sits in two folders', async () => {
        await writeRawFile(projectPath, 'issues/Timeout/51.json', open)
        await writeRawFile(projectPath, 'issues/Timeout renamed/51.json', {
            ...open,
            name: 'Timeout renamed',
            last_updated_time: '2026-04-01T00:00:00.000Z',
        })

        const raw = await loadRawIssues(projectPath)

        expect(raw.issues).toHaveLength(1)
        expect(raw.issues[0]!.record.name).toBe('Timeout renamed')
    })

    test('skips a file that is not valid JSON and lists it', async () => {
        await writeRawFile(projectPath, 'issues/Timeout/51.json', open)
        await Bun.write(join(projectPath, 'src/zoho-projects/raw/issues/Broken/52.json'), '{not json')

        const raw = await loadRawIssues(projectPath)

        expect(raw.issues.map((issue) => issue.record.id)).toEqual(['51'])
        expect(raw.skippedFiles).toEqual([join(projectPath, 'src/zoho-projects/raw/issues/Broken/52.json')])
    })

    test('returns nothing when raw/issues does not exist', async () => {
        const raw = await loadRawIssues(projectPath)

        expect(raw.issues).toEqual([])
        expect(raw.skippedFiles).toEqual([])
    })

    test('leaves the task tree untouched by the files under raw/issues', async () => {
        await writeRawFile(projectPath, 'issues/Timeout/51.json', open)
        await writeRawFile(projectPath, 'issues/Timeout/51.comments.json', [comment])
        await writeRawFile(projectPath, 'Discovery/task-lists/Research/tasks/Interview/51.json', {
            id: '51',
            name: 'Interview',
            tasklist: { id: '21', name: 'Research' },
            milestone: { id: '11', name: 'Discovery' },
        })

        const tree = await loadRawTree(projectPath)

        expect(tree.tasksById.get('51')!.comments).toEqual([])
        expect(tree.milestones).toHaveLength(1)
    })
})
