import { afterEach, describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { createCommandLogger, logger } from '@/shared/logger'

import { buildSettings, createTempProject, removeTempProject } from '../../support/temp-project'

let projectPath: string | null = null

afterEach(async () => {
    if (projectPath) {
        await removeTempProject(projectPath)
        projectPath = null
    }
})

async function startProject(logFile?: string): Promise<string> {
    projectPath = await createTempProject(logFile ? buildSettings({ logs: { file: logFile } }) : buildSettings())

    return projectPath
}

async function readEntryWithMessage(logFilePath: string, message: string): Promise<Record<string, unknown>> {
    const contents = await Bun.file(logFilePath).text()
    const entry = contents
        .split('\n')
        .filter((line) => line.length > 0)
        .map((line) => JSON.parse(line) as Record<string, unknown>)
        .find((candidate) => candidate.msg === message)

    expect(entry).toBeDefined()

    return entry as Record<string, unknown>
}

describe('shared logger', () => {
    test('writes structured JSON to .zoho-studio/cli.log by default', async () => {
        const path = await startProject()
        const logFilePath = join(path, '.zoho-studio', 'cli.log')

        const commandLogger = await createCommandLogger('functions:pull')
        commandLogger.info('structured entry')

        expect(await Bun.file(logFilePath).exists()).toBe(true)
        expect(await readEntryWithMessage(logFilePath, 'structured entry')).toMatchObject({ level: 30 })
    })

    test('follows the configured log file and creates its folder', async () => {
        const path = await startProject('var/log/zoho.log')
        const logFilePath = join(path, 'var', 'log', 'zoho.log')

        const commandLogger = await createCommandLogger('functions:pull')
        commandLogger.info('configured entry')

        expect(await readEntryWithMessage(logFilePath, 'configured entry')).toMatchObject({ level: 30 })
    })

    test('supports the standard levels', async () => {
        const path = await startProject()
        const logFilePath = join(path, '.zoho-studio', 'cli.log')

        const commandLogger = await createCommandLogger('functions:pull')
        commandLogger.debug('debug entry')
        commandLogger.warn('warn entry')
        commandLogger.error('error entry')

        expect(await readEntryWithMessage(logFilePath, 'debug entry')).toMatchObject({ level: 20 })
        expect(await readEntryWithMessage(logFilePath, 'warn entry')).toMatchObject({ level: 40 })
        expect(await readEntryWithMessage(logFilePath, 'error entry')).toMatchObject({ level: 50 })
    })

    test('tags every entry with the command name', async () => {
        const path = await startProject()
        const logFilePath = join(path, '.zoho-studio', 'cli.log')

        const commandLogger = await createCommandLogger('functions:pull')
        commandLogger.info('command entry')

        expect(await readEntryWithMessage(logFilePath, 'command entry')).toMatchObject({
            command: 'functions:pull',
        })
    })

    test('serializes an error logged as { err } with its stack', async () => {
        const path = await startProject()
        const logFilePath = join(path, '.zoho-studio', 'cli.log')

        const commandLogger = await createCommandLogger('functions:pull')
        commandLogger.error({ err: new Error('request failed') }, 'error with cause')

        const { err } = await readEntryWithMessage(logFilePath, 'error with cause')

        expect(err).toMatchObject({ type: 'Error', message: 'request failed' })
        expect((err as { stack: string }).stack).toContain('request failed')
    })

    test('shares one instance between the command loggers', async () => {
        await startProject()

        expect((await createCommandLogger('a')).level).toBe(logger.level)
        expect(logger.level).toBe('debug')
    })
})
