import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { readLocalWidget, startWidgetEmulator, type WidgetEmulator } from '@zoho-studio/zoho-crm/widget'

import { createTempProject, removeTempProject } from '../../../support/temp-project'

let projectPath: string
let emulator: WidgetEmulator | null = null
let ownServer: ReturnType<typeof Bun.serve> | null = null

async function write(relativePath: string, content: unknown) {
    const filePath = join(projectPath, relativePath)
    await mkdir(join(filePath, '..'), { recursive: true })
    await writeFile(filePath, typeof content === 'string' ? content : JSON.stringify(content))
}

function freePort(): number {
    const probe = Bun.serve({ port: 0, fetch: () => new Response() })
    const port = probe.port!
    probe.stop(true)

    return port
}

async function answers(url: string): Promise<boolean> {
    return fetch(url, { signal: AbortSignal.timeout(500) }).then(
        () => true,
        () => false
    )
}

async function widgetWithRun(port: number, command: string, extra: Record<string, unknown> = {}) {
    await write('widgets/card/widget.json', {
        url: `http://127.0.0.1:${port}/app.html`,
        run: { command, ...extra },
    })
}

const serveOn = (port: number) =>
    `${process.execPath} -e "Bun.serve({ hostname: '127.0.0.1', port: ${port}, fetch: () => new Response('ok') })"`

beforeEach(async () => {
    projectPath = await createTempProject()
})

afterEach(async () => {
    await emulator?.stop()
    emulator = null
    ownServer?.stop(true)
    ownServer = null
    await removeTempProject(projectPath)
})

describe('widget run command', () => {
    test('starts the widget for its first session and stops it with the emulator', async () => {
        const port = freePort()
        await widgetWithRun(port, serveOn(port))
        emulator = startWidgetEmulator({ projectPath, widgetStartTimeoutMs: 10_000 })

        await emulator.createSession('card')
        await emulator.createSession('card')

        expect(await answers(`http://127.0.0.1:${port}/app.html`)).toBe(true)

        await emulator.stop()
        emulator = null

        expect(await answers(`http://127.0.0.1:${port}/app.html`)).toBe(false)
    }, 15_000)

    test('leaves a widget that already answers alone', async () => {
        const port = freePort()
        ownServer = Bun.serve({ hostname: '127.0.0.1', port, fetch: () => new Response('mine') })
        await widgetWithRun(port, 'exit 7')
        emulator = startWidgetEmulator({ projectPath })

        await emulator.createSession('card')
        await emulator.stop()
        emulator = null

        expect(await (await fetch(`http://127.0.0.1:${port}/app.html`)).text()).toBe('mine')
    })

    test('reports a command that exits before the widget answers, with its output', async () => {
        await widgetWithRun(freePort(), 'echo boom && exit 3')
        emulator = startWidgetEmulator({ projectPath, widgetStartTimeoutMs: 5_000 })

        await expect(emulator.createSession('card')).rejects.toThrow(/exited with code 3[\s\S]*boom/)
    })

    test('gives up after the start timeout', async () => {
        await widgetWithRun(freePort(), 'sleep 5')
        emulator = startWidgetEmulator({ projectPath, widgetStartTimeoutMs: 500 })

        await expect(emulator.createSession('card')).rejects.toThrow('did not make')
    })

    test('does not leave a widget running when the emulator stops during its start', async () => {
        const port = freePort()
        await widgetWithRun(port, `sleep 1 && ${serveOn(port)}`)
        emulator = startWidgetEmulator({ projectPath, widgetStartTimeoutMs: 10_000 })

        const session = emulator.createSession('card').catch((error: unknown) => error)
        await Bun.sleep(200)
        await emulator.stop()
        emulator = null

        expect(String(await session)).toContain('the emulator is stopping')
        await Bun.sleep(1_500)
        expect(await answers(`http://127.0.0.1:${port}/app.html`)).toBe(false)
    }, 15_000)

    test('starts a widget again when it stopped after answering', async () => {
        const port = freePort()
        const servesThenExits = `${process.execPath} -e "Bun.serve({ hostname: '127.0.0.1', port: ${port}, fetch: () => new Response('ok') }); setTimeout(() => process.exit(0), 700)"`
        await widgetWithRun(port, servesThenExits)
        emulator = startWidgetEmulator({ projectPath, widgetStartTimeoutMs: 10_000 })

        await emulator.createSession('card')
        await Bun.sleep(1_200)
        expect(await answers(`http://127.0.0.1:${port}/app.html`)).toBe(false)

        await emulator.createSession('card')
        expect(await answers(`http://127.0.0.1:${port}/app.html`)).toBe(true)
    }, 15_000)

    test('names a run folder that does not exist', async () => {
        await widgetWithRun(freePort(), 'true', { cwd: 'nowhere' })
        emulator = startWidgetEmulator({ projectPath })

        await expect(emulator.createSession('card')).rejects.toThrow(/widgets\/card\/nowhere, does not exist/)
    })

    test('runs the command in the source folder unless run.cwd says otherwise', async () => {
        const port = freePort()
        await mkdir(join(projectPath, 'widgets/card/src'), { recursive: true })
        await widgetWithRun(port, `pwd > ../where.txt && ${serveOn(port)}`)
        emulator = startWidgetEmulator({ projectPath, widgetStartTimeoutMs: 10_000 })

        await emulator.createSession('card')

        expect(await Bun.file(join(projectPath, 'widgets/card/where.txt')).text()).toContain('widgets/card/src')
    }, 15_000)
})

describe('widget source', () => {
    test('defaults to src when the widget folder has one', async () => {
        await write('widgets/card/widget.json', { url: 'http://127.0.0.1:5050/app.html' })
        expect((await readLocalWidget(projectPath, 'card')).source).toBeUndefined()

        await mkdir(join(projectPath, 'widgets/card/src'))
        expect((await readLocalWidget(projectPath, 'card')).source).toBe('src')
    })
})
