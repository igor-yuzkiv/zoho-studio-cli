import { Command } from 'commander'

import { printPullResult, silentPullProgress } from '@/shared/pull'
import { pullTaskLists } from '@/zoho-projects/entities/task-list'

export const pullTaskListsCommand = new Command('z-projects:task-lists:pull')
    .description('Download every task list of the configured Zoho Projects project as raw JSON, under its milestone')
    .action(async () => {
        const result = await pullTaskLists(silentPullProgress)

        printPullResult(result)

        if (result.failedCount > 0) {
            process.exitCode = 1
        }
    })
