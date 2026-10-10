import { Command } from 'commander'

import { createCliPullProgress, printPullResult } from '@zoho-studio/core'
import { pullWorkflowActions, type PullWorkflowActionsOptions, workflowActionTypes } from '@zoho-studio/zoho-crm/workflow-action'

export const pullWorkflowActionsCommand = new Command('z-crm:workflow-actions:pull')
    .description('Download every Zoho CRM workflow action, with its full configuration, into the project')
    .option('--module <api_name>', 'Pull the workflow actions of a single module')
    .option('--type <action_type>', `Pull a single action type (${workflowActionTypes.join(', ')})`)
    .action(async (options: PullWorkflowActionsOptions) => {
        printPullResult(await pullWorkflowActions(options, createCliPullProgress('workflow actions')))
    })
