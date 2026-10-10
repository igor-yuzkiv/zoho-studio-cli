import { Command } from 'commander'

import { printPullResult, silentPullProgress } from '@zoho-studio/core'
import { pullTaskLists } from '@zoho-studio/zoho-projects'

export const pullTaskListsCommand = new Command('z-projects:task-lists:pull')
    .description('Download every task list of the configured Zoho Projects project as raw JSON, under its milestone')
    .action(async () => {
        const result = await pullTaskLists(silentPullProgress)

        printPullResult(result)

        if (result.failedCount > 0) {
            process.exitCode = 1
        }
    })
