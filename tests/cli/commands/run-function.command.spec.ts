import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

import { remainingPromptAnswers, scriptPrompts } from '../../support/prompt-answers'
import { startCrmStub, type CrmStub } from '../../support/crm-stub'

const { runFunctionCommand } = await import('@/commands/zoho-crm/functions')

let crm: CrmStub
let printed: string[]
let answer: Record<string, unknown>
const initialIsTTY = process.stdin.isTTY

const sourceCode = 'string button.btn_send_quote(String id, Int count)\n{\n\tinfo id;\n\treturn "sent";\n}\n'
const snapshotCode = 'void automation.sync(Int program_id)\n{\n}\n'

beforeEach(async () => {
    answer = { functions: [{ status: 'success', output: { data_type: 'string', value: 'sent' }, logs: [] }] }
    crm = await startCrmStub(() => Response.json(answer))
    printed = []
    spyOn(console, 'log').mockImplementation((line: unknown) => printed.push(String(line)))

    const source = join(crm.projectPath, 'src', 'zoho-crm', 'functions', 'btn_send_quote')
    await mkdir(source, { recursive: true })
    await Bun.write(join(source, 'btn_send_quote.deluge'), sourceCode)
    await Bun.write(join(source, 'btn_send_quote.deploy.json'), '{"id":"1"}')

    const snapshot = join(crm.projectPath, 'data', 'zoho-crm', 'functions', 'wf_sync')
    await mkdir(snapshot, { recursive: true })
    await Bun.write(
        join(snapshot, 'Sync.metadata.json'),
        JSON.stringify({ id: '2', name: 'Sync', api_name: 'wf_sync' })
    )
    await Bun.write(join(snapshot, 'Sync.deluge'), snapshotCode)
})

afterEach(async () => {
    process.stdin.isTTY = initialIsTTY
    process.exitCode = 0
    ;(console.log as unknown as { mockRestore: () => void }).mockRestore()
    await crm.stop()
})

function run(...args: string[]) {
    return runFunctionCommand.parseAsync(args, { from: 'user' })
}

describe('z-crm:functions:run without a terminal', () => {
    test('runs the code from src/ with the given arguments and prints the answer as JSON', async () => {
        await run('btn_send_quote', '--from', 'src', '--arg', 'id=1123', '-a', 'count=2', '--force')

        expect(crm.requests).toHaveLength(1)
        expect(crm.requestedUrls[0]?.pathname).toBe('/crm/v8/settings/functions/btn_send_quote/actions/test')
        expect(JSON.parse(crm.requests[0]!.body)).toEqual({
            functions: [{ script: sourceCode, arguments: { id: '1123', count: '2' } }],
        })
        expect(printed).toEqual([JSON.stringify(answer, null, 4)])
        expect(process.exitCode ?? 0).toBe(0)
    })

    test('runs the pulled code from data/', async () => {
        await run('wf_sync', '--from', 'data', '-a', 'program_id=7', '--force')

        expect(JSON.parse(crm.requests[0]!.body)).toEqual({
            functions: [{ script: snapshotCode, arguments: { program_id: '7' } }],
        })
    })

    test('exits with 1 when the run did not succeed', async () => {
        answer = { functions: [{ status: 'error', message: 'Variable not defined' }] }

        await run('wf_sync', '--from', 'data', '-a', 'program_id=7', '--force')

        expect(process.exitCode).toBe(1)
    })

    test('prints the command for the same run with --dry-run, and sends nothing', async () => {
        await run('btn_send_quote', '--from', 'src', '-a', 'id=it is', '-a', 'count=2', '--dry-run')

        expect(printed).toEqual([
            "zoho-studio z-crm:functions:run btn_send_quote --from src --arg 'id=it is' --arg count=2",
        ])
        expect(crm.requests).toHaveLength(0)
    })

    test('stops with what is missing, before sending anything', async () => {
        await expect(run('btn_send_quote', '-a', 'id=1', '-a', 'count=2', '--force')).rejects.toThrow(
            'Pass --from src or --from data'
        )
        await expect(run('--from', 'src', '--force')).rejects.toThrow(
            'Pass the API name of the function to run: btn_send_quote.'
        )
        await expect(run('btn_send_quote', '--from', 'src', '-a', 'id=1', '--force')).rejects.toThrow(
            'Pass every argument with --arg: count.'
        )
        await expect(run('btn_send_quote', '--from', 'src', '-a', 'id=1', '-a', 'count=2')).rejects.toThrow(
            'pass --force to run without a terminal'
        )
        expect(crm.requests).toHaveLength(0)
    })

    test('refuses an argument the declaration does not have', async () => {
        await expect(run('btn_send_quote', '--from', 'src', '-a', 'idd=1', '--force')).rejects.toThrow(
            'btn_send_quote has no argument idd; it declares: id, count.'
        )
    })
})

describe('z-crm:functions:run in a terminal', () => {
    beforeEach(() => {
        process.stdin.isTTY = true
    })

    test('asks for the place, the function and each missing argument, then for confirmation', async () => {
        scriptPrompts(['select', 'src'], ['search', 'btn_send_quote'], ['input', '2'], ['confirm', true])

        await run('-a', 'id=1123')

        expect(remainingPromptAnswers()).toBe(0)
        expect(JSON.parse(crm.requests[0]!.body).functions[0].arguments).toEqual({ id: '1123', count: '2' })
    })

    test('runs nothing when the confirmation is declined', async () => {
        scriptPrompts(['confirm', false])

        await run('wf_sync', '--from', 'data', '-a', 'program_id=7')

        expect(printed.at(-1)).toBe('Nothing run.')
        expect(crm.requests).toHaveLength(0)
    })

    test('turns the answers into a command with --dry-run, without asking for confirmation', async () => {
        scriptPrompts(['select', 'data'], ['search', 'wf_sync'], ['input', '7'])

        await run('--dry-run')

        expect(printed).toEqual(['zoho-studio z-crm:functions:run wf_sync --from data --arg program_id=7'])
        expect(crm.requests).toHaveLength(0)
    })
})
