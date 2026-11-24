import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { createTempProject, removeTempProject } from '../../support/temp-project'

const { makeWidgetCommand } = await import('@/commands/zoho-crm/widgets')

let projectPath: string
let printed: string[]

beforeEach(async () => {
    projectPath = await createTempProject()
    printed = []
    spyOn(console, 'log').mockImplementation((line: unknown) => printed.push(String(line)))
})

afterEach(async () => {
    ;(console.log as unknown as { mockRestore: () => void }).mockRestore()
    await removeTempProject(projectPath)
})

function run(...args: string[]) {
    return makeWidgetCommand.parseAsync(args, { from: 'user' })
}

describe('z-crm:widgets:make', () => {
    test('creates a widget that runs as is, with a Playwright config', async () => {
        await run(
            '--name=card',
            '--url=http://127.0.0.1:5000/app/widget.html',
            '--location=Custom Button',
            '--module=Deals',
            '--source=../card-widget/app'
        )

        expect(printed).toEqual([
            'Created widgets/card/widget.json',
            'Created widgets/card/scenarios/default.ts',
            'Created widgets/card/tests/card.spec.ts',
            'Created playwright.config.ts',
        ])
        expect(JSON.parse(await readFile(join(projectPath, 'widgets/card/widget.json'), 'utf8'))).toEqual({
            url: 'http://127.0.0.1:5000/app/widget.html',
            location: 'Custom Button',
            defaultScenario: 'default',
            source: '../card-widget/app',
        })
        expect(await readFile(join(projectPath, 'widgets/card/scenarios/default.ts'), 'utf8')).toContain(
            "pageLoad: { Entity: 'Deals', EntityId: '1000000000001' }"
        )
        expect(await readFile(join(projectPath, 'widgets/card/scenarios/default.ts'), 'utf8')).toContain(
            "'API.getRecord': { data: [{ id: '1000000000001' }] }"
        )
    })

    test('refuses a name that is taken and keeps an existing Playwright config', async () => {
        await run('--name=card', '--url=http://127.0.0.1:5000/')

        await expect(run('--name=card', '--url=http://127.0.0.1:5000/')).rejects.toThrow('Widget "card" already exists')

        printed = []
        await run('--name=other', '--url=http://127.0.0.1:5001/')
        expect(printed).not.toContain('Created playwright.config.ts')
    })

    test('rejects an address that is not http(s)', async () => {
        await expect(run('--name=card', '--url=widget.html')).rejects.toThrow('"url" must be the http(s) address')
    })
})
