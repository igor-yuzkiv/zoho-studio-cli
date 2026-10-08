import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import pino, { type Logger } from 'pino'

import { defaultProjectSettings, getProjectSettings } from '@/settings'

// Until a command resolves its project, the default location relative to the current folder is the
// best guess available.
let logFilePath = join(process.cwd(), defaultProjectSettings.logs.file)

// The file is opened per line rather than at import: the CLI is short-lived, so buffered writes
// can be lost at exit, and a command that never logs must not leave an empty folder behind.
function appendLogLine(line: string): void {
    mkdirSync(dirname(logFilePath), { recursive: true })
    appendFileSync(logFilePath, line)
}

export const logger = pino({ level: 'debug' }, { write: appendLogLine })

/** Points the shared logger at the project's configured file and tags every entry with `command`. */
export async function createCommandLogger(command: string): Promise<Logger> {
    const { projectPath, settings } = await getProjectSettings()

    logFilePath = resolve(projectPath, settings.logs.file)

    return logger.child({ command })
}
