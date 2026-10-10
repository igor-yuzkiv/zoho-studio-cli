import { AuthError } from '@zoho-studio/auth'
import type { PullProgress } from '@zoho-studio/core'

import type { ArtifactGroup } from './artifact-groups.service'
import type { PullOptionName, PullRun } from './browser.types'

const keptRunsCount = 20

export class PullBusyError extends Error {
    constructor(readonly runningRun: PullRun) {
        super(`${runningRun.command} is still running.`)
    }
}

type RunListener = (run: PullRun) => void

/**
 * Pulls write into the same directories and share one token store, so the runner lets only one run
 * at a time, the same guarantee a person typing commands one after another has.
 */
export class PullRunner {
    private readonly runs: PullRun[] = []
    private readonly listeners = new Set<RunListener>()
    private nextRunNumber = 1

    get currentRun(): PullRun | undefined {
        return this.runs.find((run) => run.status === 'running')
    }

    get recentRuns(): PullRun[] {
        return [...this.runs].reverse()
    }

    subscribe(listener: RunListener): () => void {
        this.listeners.add(listener)

        return () => this.listeners.delete(listener)
    }

    start(group: ArtifactGroup, options: Partial<Record<PullOptionName, string>>): PullRun {
        const runningRun = this.currentRun

        if (runningRun) {
            throw new PullBusyError(runningRun)
        }

        const run: PullRun = {
            id: String(this.nextRunNumber++),
            area: group.area,
            group: group.id,
            command: describeCommand(group, options),
            status: 'running',
            total: 0,
            completed: 0,
            currentItem: null,
            log: [],
            startedAt: new Date().toISOString(),
            finishedAt: null,
            authRequired: false,
        }

        this.runs.push(run)
        this.runs.splice(0, Math.max(0, this.runs.length - keptRunsCount))
        this.publish(run)

        void this.execute(run, group, options)

        return run
    }

    private async execute(run: PullRun, group: ArtifactGroup, options: Partial<Record<PullOptionName, string>>) {
        const progress: PullProgress = {
            start: (total) => {
                run.total = total
                run.completed = 0
                this.publish(run)
            },
            update: (itemName) => {
                run.currentItem = itemName
                this.publish(run)
            },
            increment: () => {
                run.completed++
                this.publish(run)
            },
            stop: () => {
                run.currentItem = null
                this.publish(run)
            },
        }

        try {
            const result = await group.pull(options, progress)

            run.log.push(...result.summary)
            run.status = result.failedCount > 0 ? 'partial' : 'done'
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)

            run.log.push(message)
            run.status = 'failed'
            run.authRequired = isAuthFailure(error, message)
        }

        run.finishedAt = new Date().toISOString()
        this.publish(run)
    }

    private publish(run: PullRun) {
        for (const listener of this.listeners) {
            listener(run)
        }
    }
}

function describeCommand(group: ArtifactGroup, options: Partial<Record<PullOptionName, string>>): string {
    const flags = group.options.filter((name) => options[name]).map((name) => `--${name}=${options[name]}`)

    return [group.command, ...flags].join(' ')
}

/** A missing refresh token surfaces as a plain error that tells the user to run `zoho-studio login`. */
function isAuthFailure(error: unknown, message: string): boolean {
    return error instanceof AuthError || message.includes('zoho-studio login')
}
