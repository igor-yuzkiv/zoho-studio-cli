import { afterEach, describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { pullIssuesCommand } from '@/zoho-projects/commands/issues'

import {
    answerProjectsLists,
    listPage,
    readRawDirs,
    startProjectsStub,
    type ProjectsStub,
} from '../../support/projects-stub'
import { writeRawFile } from '../../support/temp-project'

let stub: ProjectsStub | null = null

afterEach(async () => {
    await stub?.stop()
    stub = null
    process.exitCode = 0
})

const timeout = {
    id: '51',
    prefix: 'QA7-I1',
    name: 'Login timeout',
    description: '<div>Session drops<br></div>',
    last_updated_time: '2025-01-10T09:00:00.000Z',
}
const escalation = {
    id: '52',
    prefix: 'QA7-I2',
    name: 'Broken export',
    last_updated_time: '2025-02-20T09:00:00.000Z',
}
const undated = { id: '53', prefix: 'QA7-I3', name: 'Undated' }
const comment = { id: '61', comment: '<div>Fixed</div>', added_by: { full_name: 'Olena' } }

async function run(...args: string[]): Promise<void> {
    await pullIssuesCommand.parseAsync(args, { from: 'user' })
}

function commentsRequests(): string[] {
    return stub!.requestedUrls.filter((url) => url.pathname.endsWith('/comments')).map((url) => url.pathname)
}

describe('z-projects:issues:pull', () => {
    test('writes every issue with its description and comments under raw/issues', async () => {
        stub = await startProjectsStub(
            answerProjectsLists({ issues: [timeout, escalation], issueComments: () => listPage('comments', [comment]) })
        )

        await run()

        expect(await readRawDirs(stub.projectPath, 'issues')).toEqual(['Broken export', 'Login timeout'])
        expect(await readRawDirs(stub.projectPath, 'issues/Login timeout')).toEqual(['51.comments.json', '51.json'])
        expect(await Bun.file(join(stub.projectPath, 'src/zoho-projects/raw/issues/Login timeout/51.json')).json()).toEqual(
            timeout
        )
        expect(
            await Bun.file(join(stub.projectPath, 'src/zoho-projects/raw/issues/Login timeout/51.comments.json')).json()
        ).toEqual([comment])
        expect(commentsRequests()).toEqual([
            '/api/v3/portal/100/projects/200/bugs/51/comments',
            '/api/v3/portal/100/projects/200/bugs/52/comments',
        ])
        expect(stub.requestedUrls[0]?.pathname).toBe('/api/v3/portal/100/projects/200/issues')
    })

    test('keeps the issues outside the period, and the undated ones, and asks no comments for them', async () => {
        stub = await startProjectsStub(answerProjectsLists({ issues: [timeout, escalation, undated] }))

        await run('--from', '2025-01-01', '--to', '2025-01-31')

        expect(await readRawDirs(stub.projectPath, 'issues')).toEqual(['Login timeout'])
        expect(commentsRequests()).toHaveLength(1)
    })

    test('writes an empty comments file for an issue without comments', async () => {
        stub = await startProjectsStub(answerProjectsLists({ issues: [timeout] }))

        await run()

        expect(
            await Bun.file(join(stub.projectPath, 'src/zoho-projects/raw/issues/Login timeout/51.comments.json')).json()
        ).toEqual([])
    })

    test('writes a renamed issue into the folder that already holds its id', async () => {
        stub = await startProjectsStub(answerProjectsLists({ issues: [{ ...timeout, name: 'Login expires' }] }))
        await writeRawFile(stub.projectPath, 'issues/Login timeout/51.json', timeout)

        await run()

        expect(await readRawDirs(stub.projectPath, 'issues')).toEqual(['Login timeout'])
        expect(await Bun.file(join(stub.projectPath, 'src/zoho-projects/raw/issues/Login timeout/51.json')).json()).toEqual({
            ...timeout,
            name: 'Login expires',
        })
    })

    test('skips an issue whose comments fail, writes the rest and exits non-zero', async () => {
        stub = await startProjectsStub(
            answerProjectsLists({
                issues: [timeout, escalation],
                issueComments: (issueId) =>
                    issueId === '51'
                        ? Response.json({ error: { code: 6500 } }, { status: 500 })
                        : listPage('comments', []),
            })
        )

        await run()

        expect(await readRawDirs(stub.projectPath, 'issues')).toEqual(['Broken export'])
        expect(process.exitCode).toBe(1)
    })

    test('leaves raw untouched when the issues request fails', async () => {
        stub = await startProjectsStub(() => Response.json({ error: { code: 6401 } }, { status: 401 }))

        await expect(run()).rejects.toThrow(/401/)
        expect(await readRawDirs(stub.projectPath, '.')).toEqual([])
    })

    test('rejects a period whose start is after its end before any request', async () => {
        stub = await startProjectsStub(answerProjectsLists({ issues: [timeout] }))

        await expect(run('--from', '2025-02-01', '--to', '2025-01-01')).rejects.toThrow(
            '--from (2025-02-01) is later than --to (2025-01-01)'
        )
        expect(stub.requestedUrls).toHaveLength(0)
    })
})
