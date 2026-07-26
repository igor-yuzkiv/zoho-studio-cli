import { join } from 'node:path'

import pino, { type Logger } from 'pino'

// The CLI is short-lived and may exit right after a command, so writes are synchronous:
// an async destination can lose buffered lines on exit.
const destination = pino.destination({
    dest: join(process.cwd(), 'logs', 'cli.log'),
    mkdir: true,
    sync: true,
})

export const logger = pino({ level: 'debug' }, destination)

export function createCommandLogger(command: string): Logger {
    return logger.child({ command })
}
