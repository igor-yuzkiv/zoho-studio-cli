import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { renderIssuesCommand } from '@/zoho-projects/commands/issues-render'

import { buildSettings, createTempProject, removeTempProject, writeRawFile } from '../../../support/temp-project'
import { brokenExport, brokenExportComments, timeout, upgradeTask } from '../../../zoho-projects/entities/issue/services/fixtures/issues'

let projectPath: string

beforeEach(async () => {
    projectPath = await createTempProject(buildSettings({ projects: { portalId: '100', projectId: '200' } }))
})

afterEach(async () => {
    await removeTempProject(projectPath)
    process.exitCode = 0
})

const withProject = { project: { id: '200', name: 'Acme Direct' } }

async function writeFixtureRaw(): Promise<void> {
    await writeRawFile(projectPath, 'issues/Login timeout/510000.json', { ...timeout, ...withProject })
    await writeRawFile(projectPath, 'issues/Login timeout/510000.comments.json', [])
    await writeRawFile(projectPath, 'issues/Broken export/520000.json', { ...brokenExport, ...withProject })
    await writeRawFile(projectPath, 'issues/Broken export/520000.comments.json', brokenExportComments)
    await writeRawFile(projectPath, 'Pilot/task-lists/Phase/tasks/Upgrade/580000.json', {
        ...upgradeTask.record,
        tasklist: { id: '21', name: 'Phase' },
        milestone: { id: '11', name: 'Pilot' },
    })
}

async function run(): Promise<void> {
    await renderIssuesCommand.parseAsync([], { from: 'user' })
}

async function listMd(mdPath = join(projectPath, 'src/zoho-projects/md')): Promise<string[]> {
    const entries = await readdir(mdPath, { recursive: true, withFileTypes: true }).catch(() => [])

    return entries
        .filter((entry) => entry.isFile())
        .map((entry) => join(entry.parentPath, entry.name).slice(mdPath.length + 1))
        .sort()
}

async function readMd(relativePath: string): Promise<string> {
    return Bun.file(join(projectPath, 'src/zoho-projects/md', relativePath)).text()
}

async function golden(name: string): Promise<string> {
    const text = await Bun.file(join(import.meta.dir, 'fixtures', name)).text()

    return text.replace('<RENDERED_AT>', new Date().toISOString().slice(0, 10))
}

describe('z-projects:issues:render', () => {
    test('writes the index and one file per issue under its status, linking the tasks in raw', async () => {
        await writeFixtureRaw()

        await run()

        expect(await listMd()).toEqual([
            'issues/Issues.md',
            'issues/closed/52-broken-export.md',
            'issues/open/51-login-timeout-on-the-page.md',
        ])
        expect(await readMd('issues/closed/52-broken-export.md')).toContain('- [[580-upgrade-the-export-package]] — QA7-T580')
        expect(process.exitCode ?? 0).toBe(0)
    })

    test('renders the index exactly as the golden file', async () => {
        await writeFixtureRaw()

        await run()

        expect(await readMd('issues/Issues.md')).toBe(await golden('Issues.md'))
    })

    test('removes the copy under the previous status and leaves foreign files alone', async () => {
        await writeFixtureRaw()
        await run()
        await Bun.write(join(projectPath, 'src/zoho-projects/md/issues/open/my-note.md'), 'mine')
        await writeRawFile(projectPath, 'issues/Login timeout/510000.json', {
            ...timeout,
            status: { name: 'Closed', is_closed_type: true },
            last_updated_time: '2026-04-01T00:00:00.000Z',
        })

        await run()

        expect(await listMd()).toEqual([
            'issues/Issues.md',
            'issues/closed/51-login-timeout-on-the-page.md',
            'issues/closed/52-broken-export.md',
            'issues/open/my-note.md',
        ])
    })

    test('writes into the folder projects.mdPath names', async () => {
        await removeTempProject(projectPath)
        projectPath = await createTempProject(
            buildSettings({ projects: { portalId: '100', projectId: '200', mdPath: 'vault/zoho' } })
        )
        await writeFixtureRaw()

        await run()

        expect(await listMd(join(projectPath, 'vault/zoho'))).toEqual([
            'issues/Issues.md',
            'issues/closed/52-broken-export.md',
            'issues/open/51-login-timeout-on-the-page.md',
        ])
    })

    test('does nothing when raw/issues is empty', async () => {
        await run()

        expect(await listMd()).toEqual([])
        expect(process.exitCode ?? 0).toBe(0)
    })

    test('reports a raw file that is not valid JSON and exits non-zero', async () => {
        await writeFixtureRaw()
        await Bun.write(join(projectPath, 'src/zoho-projects/raw/issues/Bad/530000.json'), '{not json')

        await run()

        expect(await listMd()).toHaveLength(3)
        expect(process.exitCode).toBe(1)
    })

    test('stops before reading anything when the project ids are empty', async () => {
        await removeTempProject(projectPath)
        projectPath = await createTempProject(buildSettings({ projects: { portalId: '', projectId: '200' } }))

        await expect(run()).rejects.toThrow('projects.portalId is empty')
    })
})
