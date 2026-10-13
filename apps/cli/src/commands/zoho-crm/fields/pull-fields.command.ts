import { Command } from 'commander'

import { createCliPullProgress, printPullResult } from '@zoho-studio/core'
import { pullFields, type PullFieldsOptions } from '@zoho-studio/zoho-crm/field'

export const pullFieldsCommand = new Command('z-crm:fields:pull')
    .description('Download the fields of every local module into its own fields directory')
    .option('--module <api_name>', 'Pull the fields of a single module')
    .action(async (options: PullFieldsOptions) => {
        printPullResult(await pullFields(options, createCliPullProgress('fields')))
    })
