import { spawn, type ChildProcess } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'

import { resolveWidgetDirPath } from '../services/local-widgets.service'
import type { WidgetDescription } from '../widget.types'

export const widgetStartTimeoutMs = 60_000
const outputLinesKept = 20

export interface WidgetRunner {
    /** Starts the widget with its `run` command unless something already answers at its `url`. */
    ensureRunning(widget: WidgetDescription): Promise<void>
    stopAll(): Promise<void>
}

export interface WidgetRunnerOptions {
    startTimeoutMs?: number
}

/**
 * Starts each widget once, when its first session opens, and stops every widget it started when
 * the emulator stops. A widget started by hand keeps running: it already answers, so nothing starts.
 */
export function createWidgetRunner(projectPath: string, options: WidgetRunnerOptions = {}): WidgetRunner {
    const startTimeoutMs = options.startTimeoutMs ?? widgetStartTimeoutMs
    const starting = new Map<string, Promise<void>>()
    const processes = new Set<ChildProcess>()
    let stopped = false

    async function start(widget: WidgetDescription): Promise<void> {
        if (!widget.run || (await answers(widget.url))) {
            return
        }

        const widgetDir = resolveWidgetDirPath(projectPath, widget.name)
        const cwdName = widget.run.cwd ?? widget.source
        const cwd = cwdName ? (isAbsolute(cwdName) ? cwdName : join(widgetDir, cwdName)) : widgetDir

        if (!(await stat(cwd).catch(() => null))?.isDirectory()) {
            throw new Error(`Widget "${widget.name}": the folder to run "${widget.run.command}" in, ${cwd}, does not exist.`)
        }

        // The emulator may have stopped while the check above waited; a process started now would outlive it.
        if (stopped) {
            throw new Error(`Widget "${widget.name}" was not started: the emulator is stopping.`)
        }

        const output: string[] = []
        // Its own process group, so stopping it also stops what the command started (npm → vite).
        const child = spawn(widget.run.command, { cwd, shell: true, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
        processes.add(child)

        const keep = (chunk: Buffer) => {
            output.push(...chunk.toString().split('\n').filter(Boolean))
            output.splice(0, Math.max(0, output.length - outputLinesKept))
        }
        child.stdout?.on('data', keep)
        child.stderr?.on('data', keep)

        let exitCode: number | null = null
        let spawnError: Error | null = null
        child.on('exit', (code) => {
            exitCode = code ?? -1
            processes.delete(child)
            // A widget that stopped after it answered is started again by its next session.
            starting.delete(widget.name)
        })
        child.on('error', (error) => {
            spawnError = error
        })

        const describe = (what: string) =>
            [`Widget "${widget.name}": "${widget.run!.command}" in ${cwd} ${what}.`, ...output].join('\n')
        const deadline = Date.now() + startTimeoutMs

        while (Date.now() < deadline) {
            if (stopped) {
                stop(child)
                throw new Error(`Widget "${widget.name}" was not started: the emulator is stopping.`)
            }
            if (spawnError) throw new Error(describe(`could not start (${(spawnError as Error).message})`))
            if (exitCode !== null) throw new Error(describe(`exited with code ${exitCode} before ${widget.url} answered`))
            if (await answers(widget.url)) return
            await Bun.sleep(250)
        }

        stop(child)
        throw new Error(describe(`did not make ${widget.url} answer within ${startTimeoutMs / 1000} s`))
    }

    return {
        ensureRunning(widget) {
            if (stopped) {
                return Promise.reject(new Error(`Widget "${widget.name}" was not started: the emulator is stopping.`))
            }

            const current = starting.get(widget.name)

            if (current) {
                return current
            }

            const started = start(widget).catch((error: unknown) => {
                starting.delete(widget.name)
                throw error
            })
            starting.set(widget.name, started)

            return started
        },
        async stopAll() {
            stopped = true
            const exits = [...processes].map(
                (child) => new Promise<void>((resolve) => (child.exitCode !== null ? resolve() : child.once('exit', () => resolve())))
            )
            processes.forEach(stop)
            await Promise.race([Promise.all(exits), Bun.sleep(5_000)])
            starting.clear()
        },
    }
}

function stop(child: ChildProcess): void {
    try {
        process.kill(-child.pid!, 'SIGTERM')
    } catch {
        child.kill('SIGTERM')
    }
}

/** Any HTTP answer counts: the widget is served, whatever page that address shows. */
async function answers(url: string): Promise<boolean> {
    try {
        await fetch(url, { signal: AbortSignal.timeout(1_000) })
        return true
    } catch {
        return false
    }
}
