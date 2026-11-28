import cliProgress from 'cli-progress'

import type { PullProgress, PullResult } from './pull.types'

export const silentPullProgress: PullProgress = {
    start: () => {},
    update: () => {},
    increment: () => {},
    stop: () => {},
}

/** `subject` completes the bar label: `Pulling <subject> |███| 3/10 | <item>`. */
export function createCliPullProgress(subject: string): PullProgress {
    const progressBar = new cliProgress.SingleBar(
        {
            format: `Pulling ${subject} |{bar}| {value}/{total} | {name}`,
            hideCursor: true,
            clearOnComplete: false,
        },
        cliProgress.Presets.shades_classic
    )

    return {
        start: (total) => progressBar.start(total, 0, { name: 'Starting...' }),
        update: (itemName) => progressBar.update({ name: itemName }),
        increment: () => progressBar.increment(),
        stop: () => progressBar.stop(),
    }
}

/**
 * A partial failure still completes the run, but a script or a preset must be able to tell it from a
 * clean one, so it ends the process with a non-zero exit code.
 */
export function reportPullResult(result: PullResult): void {
    for (const line of result.summary) {
        console.log(line)
    }

    if (result.failedCount > 0) {
        process.exitCode = 1
    }
}
