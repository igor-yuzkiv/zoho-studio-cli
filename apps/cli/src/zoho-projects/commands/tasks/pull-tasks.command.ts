import { Command } from 'commander'

import { createCliPullProgress, printPullResult } from '@zoho-studio/core'
import { pullTasks, type PullTasksOptions } from '@zoho-studio/zoho-projects'

export const pullTasksCommand = new Command('z-projects:tasks:pull')
    .description(
        'Download the tasks of the configured Zoho Projects project, with their comments, as raw JSON. ' +
            'Without --from/--to every task is pulled; with them only the tasks last modified in that period (dates as YYYY-MM-DD, inclusive, UTC)'
    )
    .option('--from <YYYY-MM-DD>', 'Only tasks last modified on or after this UTC date')
    .option('--to <YYYY-MM-DD>', 'Only tasks last modified on or before this UTC date')
    .action(async (options: PullTasksOptions) => {
        const result = await pullTasks(options, createCliPullProgress('tasks'))

        printPullResult(result)

        if (result.failedCount > 0) {
            process.exitCode = 1
        }
    })
