import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { renderTasksCommand } from '@/zoho-projects/commands/tasks-render'

import { buildSettings, createTempProject, removeTempProject, writeRawFile } from '../../support/temp-project'
import { routeShift, routeShiftComments, upgrade } from '../entities/task/services/fixtures/tasks'

let projectPath: string

beforeEach(async () => {
    projectPath = await createTempProject(buildSettings({ projects: { portalId: '100', projectId: '200' } }))
})

afterEach(async () => {
    await removeTempProject(projectPath)
    process.exitCode = 0
})

const pilot = { id: '11', name: 'Pilot' }
const phase22 = { id: '21', name: 'Phase 22: Technical Maintenance &amp; Platform Updates', milestone: pilot }
const withProject = { project: { id: '200', name: 'Acme Direct' } }

async function writeFixtureRaw(): Promise<void> {
    await writeRawFile(projectPath, 'Pilot/11.json', pilot)
    await writeRawFile(projectPath, 'Pilot/task-lists/Phase 22/21.json', phase22)
    await writeRawFile(projectPath, 'Pilot/task-lists/Phase 22/tasks/Upgrade/580000.json', {
        ...upgrade,
        ...withProject,
    })
    await writeRawFile(projectPath, 'Pilot/task-lists/Phase 22/tasks/Upgrade/580000.comments.json', [])
    await writeRawFile(projectPath, 'Pilot/task-lists/Phase 22/tasks/Route/697000.json', {
        ...routeShift,
        ...withProject,
    })
    await writeRawFile(projectPath, 'Pilot/task-lists/Phase 22/tasks/Route/697000.comments.json', routeShiftComments)
}

async function run(): Promise<void> {
    await renderTasksCommand.parseAsync([], { from: 'user' })
}

const phase22Dir = 'pilot/phase-22-technical-maintenance-platform-updates'

async function listMd(): Promise<string[]> {
    const mdPath = join(projectPath, 'src/zoho-projects/md')
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

describe('z-projects:tasks:render', () => {
    test('writes the whole md tree with an index per milestone and task list', async () => {
        await writeFixtureRaw()

        await run()

        expect(await listMd()).toEqual([
            'pilot/Pilot.md',
            `${phase22Dir}/Phase 22 - Technical Maintenance & Platform Updates.md`,
            `${phase22Dir}/backlog/580-upgrade-mongodb-laravel-mongodb-package.md`,
            `${phase22Dir}/closed/697-route-shift-windows-not-populating.md`,
        ])
        expect(process.exitCode ?? 0).toBe(0)
    })

    test('renders the indexes exactly as the golden files', async () => {
        await writeFixtureRaw()

        await run()

        expect(await readMd('pilot/Pilot.md')).toBe(await golden('Pilot.md'))
        expect(await readMd(`${phase22Dir}/Phase 22 - Technical Maintenance & Platform Updates.md`)).toBe(
            await golden('Phase 22 - Technical Maintenance & Platform Updates.md')
        )
    })

    test('moves a task to its new status folder on a rerun and drops the old file', async () => {
        await writeFixtureRaw()
        await run()

        await writeRawFile(projectPath, 'Pilot/task-lists/Phase 22/tasks/Upgrade/580000.json', {
            ...upgrade,
            ...withProject,
            status: { name: 'Closed', is_closed_type: true },
            last_modified_time: '2026-03-01T00:00:00.000Z',
        })
        await run()

        const files = await listMd()
        expect(files).toContain(`${phase22Dir}/closed/580-upgrade-mongodb-laravel-mongodb-package.md`)
        expect(files.some((file) => file.includes('/backlog/'))).toBe(false)
    })

    test('does nothing for an empty raw folder and exits zero', async () => {
        await run()

        expect(await listMd()).toEqual([])
        expect(process.exitCode ?? 0).toBe(0)
    })

    test('renders the rest when a raw file is broken and exits non-zero', async () => {
        await writeFixtureRaw()
        await writeRawFile(projectPath, 'Pilot/task-lists/Phase 22/tasks/Broken/1.json', '{ broken')

        await run()

        expect(await listMd()).toHaveLength(4)
        expect(process.exitCode).toBe(1)
    })

    test('lists broken files and exits non-zero even when nothing else could be read', async () => {
        await writeRawFile(projectPath, 'Pilot/11.json', '{ broken')

        await run()

        expect(await listMd()).toEqual([])
        expect(process.exitCode).toBe(1)
    })

    test('writes into the folder projects.mdPath names and keeps what else is there', async () => {
        await removeTempProject(projectPath)
        projectPath = await createTempProject(
            buildSettings({ projects: { portalId: '100', projectId: '200', mdPath: 'vault/zoho' } })
        )
        await writeFixtureRaw()
        const stale = join(projectPath, 'vault/zoho/old-note.md')
        await mkdir(join(stale, '..'), { recursive: true })
        await Bun.write(stale, 'my own note')

        await run()

        expect(await Bun.file(stale).text()).toBe('my own note')
        expect(await Bun.file(join(projectPath, 'vault/zoho/pilot/Pilot.md')).exists()).toBe(true)
        expect(await listMd()).toEqual([])
    })

    test('stops before reading anything when the portal id is empty', async () => {
        await removeTempProject(projectPath)
        projectPath = await createTempProject(buildSettings({ projects: { portalId: '', projectId: '200' } }))

        await expect(run()).rejects.toThrow('projects.portalId is empty')
    })
})
