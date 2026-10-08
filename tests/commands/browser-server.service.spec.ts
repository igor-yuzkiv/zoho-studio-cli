import { afterEach, describe, expect, test } from 'bun:test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import type { ArtifactGroupSummary, FileEntry, PullRun } from '@/commands/browser/browser.types'
import { startBrowserServer } from '@/commands/browser/browser-server.service'

import { startCrmStub, type CrmStub } from '../support/crm-stub'

let stub: CrmStub | null = null
let server: ReturnType<typeof startBrowserServer> | null = null

afterEach(async () => {
    await server?.stop(true)
    server = null
    await stub?.stop()
    stub = null
})

const twoFunctions = [
    { id: '1', name: 'first', api_name: 'first' },
    { id: '2', name: 'second', api_name: 'second' },
]

async function startProject(answer: (request: Request) => Response = () => Response.json({})) {
    stub = await startCrmStub(answer)
    const webAssetsPath = join(stub.projectPath, 'web-assets')
    await Bun.write(join(webAssetsPath, 'index.html'), '<div id="app"></div>')
    server = startBrowserServer({ projectPath: stub.projectPath, port: 0, webAssetsPath })

    return { projectPath: stub.projectPath, origin: server.url.origin }
}

async function writeSourceFile(projectPath: string, relativePath: string, content: unknown) {
    const filePath = join(projectPath, 'src', relativePath)
    await mkdir(join(filePath, '..'), { recursive: true })
    await Bun.write(filePath, typeof content === 'string' ? content : JSON.stringify(content))
}

async function waitForRun(origin: string, runId: string): Promise<PullRun> {
    for (let attempt = 0; attempt < 100; attempt++) {
        const runs = (await (await fetch(`${origin}/api/pulls`)).json()) as PullRun[]
        const run = runs.find(({ id }) => id === runId)

        if (run && run.status !== 'running') {
            return run
        }

        await Bun.sleep(50)
    }

    throw new Error(`Run ${runId} did not finish`)
}

describe('browser server', () => {
    test('listens on the loopback interface only', async () => {
        await startProject()

        expect(server?.hostname).toBe('127.0.0.1')
    })

    test('reports a group that was never pulled without a count', async () => {
        const { origin } = await startProject()
        const groups = (await (await fetch(`${origin}/api/groups`)).json()) as ArtifactGroupSummary[]
        const functions = groups.find(({ id }) => id === 'functions')

        expect(functions).toMatchObject({
            area: 'crm',
            count: null,
            pulledAt: null,
            relativePath: 'zoho-crm/functions',
        })
    })

    test('counts one artifact per pulled item', async () => {
        const { origin, projectPath } = await startProject()
        await writeSourceFile(projectPath, 'zoho-crm/functions/first/first.metadata.json', {})
        await writeSourceFile(projectPath, 'zoho-crm/functions/first/first.deluge', 'void x() {}')
        await writeSourceFile(projectPath, 'zoho-crm/functions/second/second.metadata.json', {})

        const groups = (await (await fetch(`${origin}/api/groups`)).json()) as ArtifactGroupSummary[]
        const functions = groups.find(({ id }) => id === 'functions')

        expect(functions?.count).toBe(2)
        expect(functions?.pulledAt).not.toBeNull()
        expect(functions?.absolutePath).toBe(join(projectPath, 'src/zoho-crm/functions'))
    })

    test('reads trees, files and JSON bundles below src', async () => {
        const { origin, projectPath } = await startProject()
        await writeSourceFile(projectPath, 'zoho-crm/workflows/Big Deal.json', { name: 'Big Deal' })

        const tree = (await (await fetch(`${origin}/api/tree?path=zoho-crm&depth=2`)).json()) as FileEntry
        const file = await fetch(`${origin}/api/file?path=${encodeURIComponent('zoho-crm/workflows/Big Deal.json')}`)
        const bundle = await (await fetch(`${origin}/api/json?path=zoho-crm/workflows`)).json()

        expect(tree.children?.[0]?.children?.[0]?.path).toBe('zoho-crm/workflows/Big Deal.json')
        expect(await file.json()).toEqual({ name: 'Big Deal' })
        expect(bundle).toEqual({ 'zoho-crm/workflows/Big Deal.json': { name: 'Big Deal' } })
    })

    test('refuses a path that leaves src', async () => {
        const { origin } = await startProject()

        const response = await fetch(`${origin}/api/file?path=../.zoho-studio/settings.json`)

        expect(response.status).toBe(400)
    })

    test('runs a pull and reports its summary', async () => {
        const { origin, projectPath } = await startProject((request) =>
            new URL(request.url).pathname.endsWith('/settings/functions')
                ? Response.json({ functions: twoFunctions, info: { more_records: false } })
                : Response.json({ functions: [{ script: 'void f() {}' }] })
        )

        const response = await fetch(`${origin}/api/pulls`, {
            method: 'POST',
            body: JSON.stringify({ area: 'crm', group: 'functions', options: {} }),
        })
        const run = await waitForRun(origin, ((await response.json()) as PullRun).id)

        expect(response.status).toBe(202)
        expect(run).toMatchObject({ status: 'done', total: 2, completed: 2, command: 'z-crm:functions:pull' })
        expect(run.log).toContain('Functions found: 2')
        expect(await Bun.file(join(projectPath, 'src/zoho-crm/functions/first/first.metadata.json')).exists()).toBe(
            true
        )
    })

    test('refuses a second pull while one is running', async () => {
        const { origin } = await startProject((request) =>
            new URL(request.url).pathname.endsWith('/settings/functions')
                ? Response.json({ functions: twoFunctions, info: { more_records: false } })
                : Response.json({ functions: [{ script: '' }] })
        )
        const pull = () =>
            fetch(`${origin}/api/pulls`, {
                method: 'POST',
                body: JSON.stringify({ area: 'crm', group: 'functions', options: {} }),
            })

        const first = await pull()
        const second = await pull()

        expect(second.status).toBe(409)
        await waitForRun(origin, ((await first.json()) as PullRun).id)
    })

    test('reports a failed pull with its error', async () => {
        const { origin } = await startProject(() => Response.json({ code: 'INVALID' }, { status: 400 }))

        const response = await fetch(`${origin}/api/pulls`, {
            method: 'POST',
            body: JSON.stringify({ area: 'crm', group: 'functions', options: {} }),
        })
        const run = await waitForRun(origin, ((await response.json()) as PullRun).id)

        expect(run.status).toBe('failed')
        expect(run.log.length).toBeGreaterThan(0)
    })

    test('passes options through to the pull', async () => {
        const { origin } = await startProject()

        const response = await fetch(`${origin}/api/pulls`, {
            method: 'POST',
            body: JSON.stringify({ area: 'projects', group: 'tasks', options: { from: 'not-a-date' } }),
        })
        const run = await waitForRun(origin, ((await response.json()) as PullRun).id)

        expect(run.command).toBe('z-projects:tasks:pull --from=not-a-date')
        expect(run.status).toBe('failed')
    })

    test('answers an unknown group with 404', async () => {
        const { origin } = await startProject()

        const response = await fetch(`${origin}/api/pulls`, {
            method: 'POST',
            body: JSON.stringify({ area: 'crm', group: 'nothing', options: {} }),
        })

        expect(response.status).toBe(404)
    })

    test('serves the page and nothing outside its folder', async () => {
        const { origin } = await startProject()

        expect(await (await fetch(`${origin}/`)).text()).toBe('<div id="app"></div>')
        expect((await fetch(`${origin}/%2e%2e/.zoho-studio/settings.json`)).status).toBe(404)
    })
})
