import { appendFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

import pino, { type Logger } from 'pino'

// The file is opened per line rather than at import: the CLI is short-lived, so buffered writes
// can be lost at exit, and a command that never logs must not leave an empty logs/ behind.
function appendLogLine(line: string): void {
    const logDirPath = join(process.cwd(), 'logs')

    mkdirSync(logDirPath, { recursive: true })
    appendFileSync(join(logDirPath, 'cli.log'), line)
}

export const logger = pino({ level: 'debug' }, { write: appendLogLine })

export function createCommandLogger(command: string): Logger {
    return logger.child({ command })
}
