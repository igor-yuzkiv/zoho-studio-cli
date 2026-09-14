import { afterEach, describe, expect, test } from 'bun:test'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { pullMilestonesCommand } from '@/zoho-projects/commands/milestones'
import { pullTaskListsCommand } from '@/zoho-projects/commands/task-lists'
import { pullTasksCommand } from '@/zoho-projects/commands/tasks'

import { listPage, startProjectsStub, type ProjectsStub } from '../../support/projects-stub'

let stub: ProjectsStub | null = null

afterEach(async () => {
    await stub?.stop()
    stub = null
    process.exitCode = 0
})

const discovery = { id: '11', name: 'Discovery' }
const research = { id: '21', name: 'Research', milestone: { id: '11', name: 'Discovery' } }
const interview = {
    id: '31',
    name: 'Interview',
    tasklist: { id: '21', name: 'Research' },
    milestone: { id: '11', name: 'Discovery' },
    last_modified_time: '2025-01-10T09:00:00.000Z',
}
const report = {
    id: '32',
    name: 'Report',
    tasklist: { id: '21', name: 'Research' },
    milestone: { id: '11', name: 'Discovery' },
    last_modified_time: '2025-02-20T09:00:00.000Z',
}
const loose = {
    id: '33',
    name: 'Loose',
    milestone: { id: '11', name: 'Discovery' },
    last_modified_time: '2025-01-11T09:00:00.000Z',
}
const comment = { id: '41', comment: 'Looks good' }

interface Answers {
    milestones?: unknown[]
    taskLists?: unknown[]
    tasks?: unknown[]
    comments?: (taskId: string) => Response
}

function answer({
    milestones = [discovery],
    taskLists = [research],
    tasks = [],
    comments,
}: Answers): (request: Request) => Response {
    return (request) => {
        const { pathname } = new URL(request.url)
        const commentsMatch = pathname.match(/\/tasks\/([^/]+)\/comments$/)

        if (commentsMatch) {
            return comments ? comments(commentsMatch[1]!) : listPage('comments', [comment])
        }

        if (pathname.endsWith('/phases')) {
            return listPage('milestones', milestones)
        }

        if (pathname.endsWith('/tasklists')) {
            return listPage('tasklists', taskLists)
        }

        return listPage('tasks', tasks)
    }
}

async function run(...args: string[]): Promise<void> {
    await pullTasksCommand.parseAsync(args, { from: 'user' })
}

async function readDirs(projectPath: string, relativePath: string): Promise<string[]> {
    return (await readdir(join(projectPath, 'src/zoho-projects/raw', relativePath)).catch(() => [])).sort()
}

function commentsRequests(): number {
    return stub!.requestedUrls.filter((url) => url.pathname.endsWith('/comments')).length
}

const researchTasks = 'Discovery/task-lists/Research/tasks'

describe('z-projects:tasks:pull', () => {
    test('writes every task with its comments into the folders earlier pulls created', async () => {
        stub = await startProjectsStub(answer({ tasks: [interview, report] }))
        await pullMilestonesCommand.parseAsync([], { from: 'user' })
        await pullTaskListsCommand.parseAsync([], { from: 'user' })

        await run()

        expect(await readDirs(stub.projectPath, researchTasks)).toEqual(['Interview', 'Report'])
        expect(await readDirs(stub.projectPath, `${researchTasks}/Interview`)).toEqual(['31.comments.json', '31.json'])
        expect(
            await Bun.file(
                join(stub.projectPath, 'src/zoho-projects/raw', researchTasks, 'Interview/31.comments.json')
            ).json()
        ).toEqual([comment])
        expect(commentsRequests()).toBe(2)
    })

    test('keeps the tasks outside the period and asks no comments for them', async () => {
        stub = await startProjectsStub(answer({ tasks: [interview, report] }))

        await run('--from', '2025-01-01', '--to', '2025-01-31')

        expect(await readDirs(stub.projectPath, researchTasks)).toEqual(['Interview'])
        expect(commentsRequests()).toBe(1)
    })

    test('fetches the task list and the milestone a task needs when they are not local', async () => {
        stub = await startProjectsStub(answer({ tasks: [interview] }))

        await run()

        expect(await Bun.file(join(stub.projectPath, 'src/zoho-projects/raw/Discovery/11.json')).json()).toEqual(
            discovery
        )
        expect(
            await Bun.file(join(stub.projectPath, 'src/zoho-projects/raw/Discovery/task-lists/Research/21.json')).json()
        ).toEqual(research)
        expect(await readDirs(stub.projectPath, researchTasks)).toEqual(['Interview'])
    })

    test('puts a task without a task list under _no-task-list of its milestone', async () => {
        stub = await startProjectsStub(answer({ tasks: [loose] }))

        await run()

        expect(await readDirs(stub.projectPath, 'Discovery/task-lists/_no-task-list/tasks')).toEqual(['Loose'])
    })

    test('appends the id to the folder of a second task with the same name', async () => {
        stub = await startProjectsStub(answer({ tasks: [interview, { ...report, name: 'Interview' }] }))

        await run()

        expect(await readDirs(stub.projectPath, researchTasks)).toEqual(['Interview', 'Interview.32'])
    })

    test('writes an empty comments file for a task without comments', async () => {
        stub = await startProjectsStub(answer({ tasks: [interview], comments: () => listPage('comments', []) }))

        await run()

        expect(
            await Bun.file(
                join(stub.projectPath, 'src/zoho-projects/raw', researchTasks, 'Interview/31.comments.json')
            ).json()
        ).toEqual([])
    })

    test('skips a task whose comments fail, writes the rest and exits non-zero', async () => {
        stub = await startProjectsStub(
            answer({
                tasks: [interview, report],
                comments: (taskId) =>
                    taskId === '31'
                        ? Response.json({ error: { code: 6500 } }, { status: 500 })
                        : listPage('comments', []),
            })
        )

        await run()

        expect(await readDirs(stub.projectPath, researchTasks)).toEqual(['Report'])
        expect(process.exitCode).toBe(1)
    })

    test('leaves raw untouched when the task list request fails', async () => {
        stub = await startProjectsStub(() => Response.json({ error: { code: 6401 } }, { status: 401 }))

        await expect(run()).rejects.toThrow(/401/)
        expect(await readDirs(stub.projectPath, '.')).toEqual([])
    })

    test('rejects a period whose start is after its end before any request', async () => {
        stub = await startProjectsStub(answer({ tasks: [interview] }))

        await expect(run('--from', '2025-02-01', '--to', '2025-01-01')).rejects.toThrow(
            '--from (2025-02-01) is later than --to (2025-01-01)'
        )
        expect(stub.requestedUrls).toHaveLength(0)
    })

    test('rejects a date that is not YYYY-MM-DD before any request', async () => {
        stub = await startProjectsStub(answer({ tasks: [interview] }))

        await expect(run('--from', '01.02.2025')).rejects.toThrow('--from must be a date as YYYY-MM-DD')
        expect(stub.requestedUrls).toHaveLength(0)
    })
})
