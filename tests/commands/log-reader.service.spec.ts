import { afterEach, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { readLogPage } from '@/commands/browser/log-reader.service'

let projectPath: string | null = null

afterEach(async () => {
    if (projectPath) {
        await rm(projectPath, { recursive: true, force: true })
        projectPath = null
    }
})

async function writeLog(lines: string[]) {
    projectPath = await mkdtemp(join(tmpdir(), 'zoho-studio-log-'))
    await mkdir(join(projectPath, 'logs'))
    await Bun.write(join(projectPath, 'logs/cli.log'), lines.join('\n') + '\n')

    return projectPath
}

const entry = (index: number) =>
    JSON.stringify({
        level: 30,
        time: 1_700_000_000_000 + index,
        pid: 1,
        hostname: 'h',
        command: 'cmd',
        msg: `entry ${index}`,
    })

describe('readLogPage', () => {
    test('returns the newest entries first and a cursor to the older ones', async () => {
        const path = await writeLog([0, 1, 2, 3, 4].map(entry))

        const firstPage = await readLogPage(path, 'logs/cli.log', null, 2)
        const secondPage = await readLogPage(path, 'logs/cli.log', firstPage.nextCursor, 2)
        const lastPage = await readLogPage(path, 'logs/cli.log', secondPage.nextCursor, 2)

        expect(firstPage.entries.map(({ message }) => message)).toEqual(['entry 4', 'entry 3'])
        expect(secondPage.entries.map(({ message }) => message)).toEqual(['entry 2', 'entry 1'])
        expect(lastPage.entries.map(({ message }) => message)).toEqual(['entry 0'])
        expect(lastPage.nextCursor).toBeNull()
    })

    test('names the level and keeps the other fields as details', async () => {
        const path = await writeLog([
            JSON.stringify({ level: 50, time: 0, pid: 1, hostname: 'h', msg: 'boom', apiName: 'x' }),
        ])

        const { entries } = await readLogPage(path, 'logs/cli.log', null, 10)

        expect(entries[0]).toMatchObject({ level: 'error', message: 'boom', command: null, details: { apiName: 'x' } })
    })

    test('shows a broken line as it is', async () => {
        const path = await writeLog(['{"level":30,"msg":"cut'])

        const { entries } = await readLogPage(path, 'logs/cli.log', null, 10)

        expect(entries[0]?.message).toBe('{"level":30,"msg":"cut')
    })

    test('reads an absent log as empty', async () => {
        projectPath = await mkdtemp(join(tmpdir(), 'zoho-studio-log-'))

        expect(await readLogPage(projectPath, 'logs/cli.log', null, 10)).toMatchObject({
            entries: [],
            nextCursor: null,
        })
    })
})
