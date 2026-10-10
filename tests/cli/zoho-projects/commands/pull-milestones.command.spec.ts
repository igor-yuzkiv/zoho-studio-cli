import { afterEach, describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { pullMilestonesCommand } from '@/zoho-projects/commands/milestones'

import { listPage, readRawDirs, startProjectsStub, type ProjectsStub } from '../../../support/projects-stub'

let stub: ProjectsStub | null = null

afterEach(async () => {
    await stub?.stop()
    stub = null
})

const discovery = { id: '11', name: 'Discovery', status_type: 'closed' }
const delivery = { id: '12', name: 'Delivery', status_type: 'open' }

async function run(): Promise<void> {
    await pullMilestonesCommand.parseAsync([], { from: 'user' })
}

describe('z-projects:milestones:pull', () => {
    test('writes one folder per milestone with the raw record inside', async () => {
        stub = await startProjectsStub(() => listPage('milestones', [discovery, delivery]))

        await run()

        expect(await readRawDirs(stub.projectPath)).toEqual(['Delivery', 'Discovery'])
        expect(await Bun.file(join(stub.projectPath, 'src/zoho-projects/raw/Discovery/11.json')).json()).toEqual(
            discovery
        )
    })

    test('finds its folder by id on a rerun, whatever the current name', async () => {
        let current = [discovery]
        stub = await startProjectsStub(() => listPage('milestones', current))
        await run()

        current = [{ ...discovery, name: 'Kickoff', status_type: 'open' }]
        await run()

        expect(await readRawDirs(stub.projectPath)).toEqual(['Discovery'])
        expect((await Bun.file(join(stub.projectPath, 'src/zoho-projects/raw/Discovery/11.json')).json()).name).toBe(
            'Kickoff'
        )
    })

    test('appends the id to the folder of a second milestone with the same name', async () => {
        stub = await startProjectsStub(() => listPage('milestones', [discovery, { ...delivery, name: 'Discovery' }]))

        await run()

        expect(await readRawDirs(stub.projectPath)).toEqual(['Discovery', 'Discovery.12'])
    })

    test('leaves raw untouched when the list request fails', async () => {
        stub = await startProjectsStub(() => Response.json({ error: { code: 6401 } }, { status: 401 }))

        await expect(run()).rejects.toThrow(/401/)
        expect(await readRawDirs(stub.projectPath)).toEqual([])
    })
})
