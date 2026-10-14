import { Command } from 'commander'

import { createCliPullProgress, printPullResult } from '@zoho-studio/core'
import { pullLayouts, type PullLayoutsOptions } from '@zoho-studio/zoho-crm/layout'

export const pullLayoutsCommand = new Command('z-crm:layouts:pull')
    .description(
        'Download the layouts of every local module, with their sections and formulas, into its layouts directory'
    )
    .option('--module <api_name>', 'Pull the layouts of a single module')
    .action(async (options: PullLayoutsOptions) => {
        printPullResult(await pullLayouts(options, createCliPullProgress('layouts')))
    })
