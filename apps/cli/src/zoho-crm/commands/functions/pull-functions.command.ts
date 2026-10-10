import { Command } from 'commander'

import { createCliPullProgress, printPullResult } from '@zoho-studio/core'
import { pullFunctions } from '@zoho-studio/zoho-crm/function'

export const pullFunctionsCommand = new Command('z-crm:functions:pull')
    .description('Download every Zoho function into the project functions directory')
    .action(async () => {
        printPullResult(await pullFunctions(createCliPullProgress('functions')))
    })
