import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { createCommandLogger as CreateCommandLogger, logger as SharedLogger } from '@/shared/logger'

const initialCwd = process.cwd()

let projectPath: string
let logFilePath: string
let logger: typeof SharedLogger
let createCommandLogger: typeof CreateCommandLogger

// The destination is opened when the module is first imported, so the working directory
// has to be the temp project before that happens.
beforeAll(async () => {
    projectPath = await mkdtemp(join(tmpdir(), 'zoho-studio-logger-'))
    process.chdir(projectPath)
    logFilePath = join(projectPath, 'logs', 'cli.log')
    ;({ createCommandLogger, logger } = await import('@/shared/logger'))
})

afterAll(async () => {
    process.chdir(initialCwd)
    await rm(projectPath, { recursive: true, force: true })
})

async function readLogEntries(): Promise<Record<string, unknown>[]> {
    const contents = await Bun.file(logFilePath).text()

    return contents
        .split('\n')
        .filter((line) => line.length > 0)
        .map((line) => JSON.parse(line) as Record<string, unknown>)
}

async function readEntryWithMessage(message: string): Promise<Record<string, unknown>> {
    const entry = (await readLogEntries()).find((candidate) => candidate.msg === message)

    expect(entry).toBeDefined()

    return entry as Record<string, unknown>
}

describe('shared logger', () => {
    test('writes structured JSON to logs/cli.log', async () => {
        logger.info('structured entry')

        expect(await Bun.file(logFilePath).exists()).toBe(true)
        expect(await readEntryWithMessage('structured entry')).toMatchObject({ level: 30 })
    })

    test('supports the standard levels', async () => {
        logger.debug('debug entry')
        logger.warn('warn entry')
        logger.error('error entry')

        expect(await readEntryWithMessage('debug entry')).toMatchObject({ level: 20 })
        expect(await readEntryWithMessage('warn entry')).toMatchObject({ level: 40 })
        expect(await readEntryWithMessage('error entry')).toMatchObject({ level: 50 })
    })

    test('a command logger tags every entry with the command name', async () => {
        createCommandLogger('functions:pull').info('command entry')

        expect(await readEntryWithMessage('command entry')).toMatchObject({ command: 'functions:pull' })
    })

    test('serializes an error logged as { err } with its stack', async () => {
        logger.error({ err: new Error('request failed') }, 'error with cause')

        const { err } = await readEntryWithMessage('error with cause')

        expect(err).toMatchObject({ type: 'Error', message: 'request failed' })
        expect((err as { stack: string }).stack).toContain('request failed')
    })

    test('shares one instance between the command loggers', () => {
        expect(createCommandLogger('a').level).toBe(logger.level)
        expect(logger.level).toBe('debug')
    })
})
