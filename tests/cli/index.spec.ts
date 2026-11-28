import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import packageJson from '../../package.json'

const cliEntryPath = join(import.meta.dir, '../../apps/cli/src/index.ts')

function runCli(...args: string[]) {
    const result = Bun.spawnSync(['bun', cliEntryPath, ...args])

    return { exitCode: result.exitCode, stdout: result.stdout.toString() }
}

describe('zoho-studio --version', () => {
    test('prints the version of the root package.json', () => {
        const { exitCode, stdout } = runCli('--version')

        expect(exitCode).toBe(0)
        expect(stdout.trim()).toBe(packageJson.version)
    })

    test('answers to -V as well', () => {
        expect(runCli('-V').stdout.trim()).toBe(packageJson.version)
    })
})
