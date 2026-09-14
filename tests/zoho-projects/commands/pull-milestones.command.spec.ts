import { afterEach, describe, expect, test } from 'bun:test'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { pullMilestonesCommand } from '@/zoho-projects/commands/milestones'

import { listPage, startProjectsStub, type ProjectsStub } from '../../support/projects-stub'

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

async function readRawDirs(projectPath: string): Promise<string[]> {
    return (await readdir(join(projectPath, 'src/zoho-projects/raw')).catch(() => [])).sort()
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
        const projectPath = await withProject(async (answer) => {
            answer.current = listPageOf([discovery])
            await run()
            answer.current = listPageOf([{ ...discovery, name: 'Kickoff', status_type: 'open' }])
            await run()
        })

        expect(await readRawDirs(projectPath)).toEqual(['Discovery'])
        expect((await Bun.file(join(projectPath, 'src/zoho-projects/raw/Discovery/11.json')).json()).name).toBe(
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

function listPageOf(items: unknown[]): () => Response {
    return () => listPage('milestones', items)
}

/** One stub whose answer changes between runs, so a rerun hits the same project folder. */
async function withProject(scenario: (answer: { current: () => Response }) => Promise<void>): Promise<string> {
    const answer = { current: listPageOf([]) }
    stub = await startProjectsStub(() => answer.current())
    await scenario(answer)

    return stub.projectPath
}
