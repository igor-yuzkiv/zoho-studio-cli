import { Command } from 'commander'

import { createCliPullProgress, reportPullResult } from '@zoho-studio/core'
import { pullWorkflows, type PullWorkflowsOptions } from '@zoho-studio/zoho-crm/workflow-rule'

export const pullWorkflowsCommand = new Command('z-crm:workflows:pull')
    .description('Download every Zoho CRM workflow rule, with its conditions and actions, into the project')
    .option('--module <api_name>', 'Pull the workflow rules of a single module')
    .action(async (options: PullWorkflowsOptions) => {
        reportPullResult(await pullWorkflows(options, createCliPullProgress('workflow rules')))
    })
