import { Command } from 'commander'

import { createCliPullProgress, printPullResult } from '@/shared/pull'
import { pullIssues, type PullIssuesOptions } from '@/zoho-projects/entities/issue'

export const pullIssuesCommand = new Command('z-projects:issues:pull')
    .description(
        'Download the issues of the configured Zoho Projects project, with their comments, as raw JSON. ' +
            'Without --from/--to every issue is pulled; with them only the issues last updated in that period (dates as YYYY-MM-DD, inclusive, UTC)'
    )
    .option('--from <YYYY-MM-DD>', 'Only issues last updated on or after this UTC date')
    .option('--to <YYYY-MM-DD>', 'Only issues last updated on or before this UTC date')
    .action(async (options: PullIssuesOptions) => {
        const result = await pullIssues(options, createCliPullProgress('issues'))

        printPullResult(result)

        if (result.failedCount > 0) {
            process.exitCode = 1
        }
    })
