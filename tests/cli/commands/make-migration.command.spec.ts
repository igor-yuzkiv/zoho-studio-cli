import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { mkdir, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { remainingPromptAnswers, scriptPrompts, useDefault } from '../../support/prompt-answers'
import { createTempProject, removeTempProject } from '../../support/temp-project'

const { makeMigrationCommand } = await import('@/commands/zoho-crm/migrations')

let projectPath: string
let printed: string[]
const initialIsTTY = process.stdin.isTTY
const migrationsPath = () => join(projectPath, 'migrations', 'zoho-crm')

beforeEach(async () => {
    projectPath = await createTempProject()
    printed = []
    spyOn(console, 'log').mockImplementation((line: unknown) => printed.push(String(line)))
    process.stdin.isTTY = true
})

afterEach(async () => {
    process.stdin.isTTY = initialIsTTY
    ;(console.log as unknown as { mockRestore: () => void }).mockRestore()
    await removeTempProject(projectPath)
})

function run() {
    return makeMigrationCommand.parseAsync([], { from: 'user' })
}

describe('z-crm:migrations:make', () => {
    test('creates a module migration from the labels, proposing the singular one', async () => {
        scriptPrompts(['select', 'create'], ['input', 'Customer Orders'], ['input', useDefault], ['confirm', true])

        await run()

        const [file] = await readdir(migrationsPath())
        expect(remainingPromptAnswers()).toBe(0)
        expect(file).toMatch(/^\d{4}_\d{2}_\d{2}_\d{6}_create_customer_orders\.ts$/)
        expect(await readFile(join(migrationsPath(), file!), 'utf8')).toContain(
            "        singular_label: 'Customer Order',\n        plural_label: 'Customer Orders',"
        )
        expect(printed).toContain(`Created migrations/zoho-crm/${file}`)
    })

    test('creates a fields migration for a module picked from the pulled ones', async () => {
        await mkdir(join(projectPath, 'data', 'zoho-crm', 'modules', 'Deals'), { recursive: true })
        scriptPrompts(['select', 'update'], ['search', 'Deals'], ['confirm', true])

        await run()

        const [file] = await readdir(migrationsPath())
        expect(file).toMatch(/_update_deals\.ts$/)
        expect(await readFile(join(migrationsPath(), file!), 'utf8')).toContain("module: 'Deals',")
    })

    test('asks for the API name when no module is pulled', async () => {
        scriptPrompts(['select', 'update'], ['input', 'Projects'], ['confirm', true])

        await run()

        expect(await readdir(migrationsPath())).toEqual([expect.stringMatching(/_update_projects\.ts$/)])
    })

    test('shows what will be created and creates nothing when declined', async () => {
        scriptPrompts(['select', 'update'], ['input', 'Projects'], ['confirm', false])

        await run()

        expect(printed).toContain('\nMigration to create:')
        expect(printed).toContain('  Action: add fields to the module "Projects"')
        expect(printed.at(-1)).toBe('Nothing created.')
        expect(await readdir(migrationsPath()).catch(() => [])).toEqual([])
    })

    test('needs a terminal', async () => {
        process.stdin.isTTY = false

        await expect(run()).rejects.toThrow(
            'z-crm:migrations:make asks questions, so it needs an interactive terminal.'
        )
    })
})
