import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'

const cliEntryPath = join(import.meta.dir, '../../../apps/cli/src/index.ts')

function runInstructions(...args: string[]) {
    const result = Bun.spawnSync(['bun', cliEntryPath, 'instructions', ...args])

    return { exitCode: result.exitCode, stdout: result.stdout.toString(), stderr: result.stderr.toString() }
}

describe('zoho-studio instructions', () => {
    test('prints the overview with every command', () => {
        const { exitCode, stdout } = runInstructions()

        expect(exitCode).toBe(0)
        expect(stdout).toStartWith('# zoho-studio\n')
        expect(stdout).toContain('`z-crm:functions:deploy`')
    })

    test('prints one command', () => {
        const { exitCode, stdout } = runInstructions('z-crm:functions:pull')

        expect(exitCode).toBe(0)
        expect(stdout).toStartWith('# z-crm:functions:pull\n')
    })

    test('exits with 1 and names close commands for an unknown name', () => {
        const { exitCode, stdout, stderr } = runInstructions('z-crm:functions:pul')

        expect(exitCode).toBe(1)
        expect(stdout).toBe('')
        expect(stderr).toContain('z-crm:functions:pull')
    })
})
