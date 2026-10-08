import { resolve } from 'node:path'

import type { LogEntry, LogLevel, LogPage } from './browser.types'

const levelNames: Record<number, LogLevel> = {
    10: 'trace',
    20: 'debug',
    30: 'info',
    40: 'warn',
    50: 'error',
    60: 'fatal',
}

/**
 * Reads the project log newest first, a page at a time. The CLI appends one pino JSON object per
 * line, so a line number is a stable cursor while the file only grows.
 */
export async function readLogPage(
    projectPath: string,
    logFile: string,
    before: number | null,
    limit: number
): Promise<LogPage> {
    const filePath = resolve(projectPath, logFile)
    const file = Bun.file(filePath)

    if (!(await file.exists())) {
        return { filePath, entries: [], nextCursor: null }
    }

    const lines = (await file.text()).split('\n')

    // The file ends with a newline, which would otherwise count as an empty last line.
    if (lines.at(-1) === '') {
        lines.pop()
    }

    const end = Math.min(before ?? lines.length, lines.length)
    const start = Math.max(0, end - limit)
    const entries: LogEntry[] = []

    for (let line = end - 1; line >= start; line--) {
        const text = lines[line]?.trim()

        if (text) {
            entries.push(parseLogLine(line, text))
        }
    }

    return { filePath, entries, nextCursor: start > 0 ? start : null }
}

function parseLogLine(line: number, text: string): LogEntry {
    try {
        const { level, time, command, msg, ...details } = JSON.parse(text)

        // Every line of a CLI run carries the same process and machine, so they are noise here.
        delete details.pid
        delete details.hostname

        return {
            line,
            time: typeof time === 'number' ? new Date(time).toISOString() : null,
            level: levelNames[level as number] ?? 'info',
            command: typeof command === 'string' ? command : null,
            message: typeof msg === 'string' ? msg : '',
            details,
        }
    } catch {
        // A line cut short by a crash is still worth showing as it is.
        return { line, time: null, level: 'info', command: null, message: text, details: {} }
    }
}
