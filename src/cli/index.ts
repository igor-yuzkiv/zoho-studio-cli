import { Command } from 'commander'

import { initCommand } from '@/commands/init'
import { loginCommand } from '@/commands/login'
import { authMigrateLegacyCommand } from '@/commands/auth-migrate-legacy'
import { statusCommand } from '@/zoho-crm/commands/status'
import { orgInfoCommand } from '@/zoho-crm/commands/org'
import { debugCommand } from '@/commands/debug'
import { presetCommand } from '@/commands/preset'
import { pullFunctionsCommand } from '@/zoho-crm/commands/functions'
import { pullModulesCommand } from '@/zoho-crm/commands/modules'
import { pullFieldsCommand } from '@/zoho-crm/commands/fields'
import { pullWorkflowsCommand } from '@/zoho-crm/commands/workflows'
import { pullWebhooksCommand } from '@/zoho-crm/commands/webhooks'
import { pullWorkflowActionsCommand } from '@/zoho-crm/commands/workflow-actions'
import { pullGlobalPicklistsCommand } from '@/zoho-crm/commands/global-picklists'
import { pullClientScriptsCommand } from '@/zoho-crm/commands/client-scripts'
import { pullStaticResourcesCommand } from '@/zoho-crm/commands/static-resources'
import { browserCommand } from '@/commands/browser'
import { pullMilestonesCommand } from '@/zoho-projects/commands/milestones'
import { pullTaskListsCommand } from '@/zoho-projects/commands/task-lists'
import { pullTasksCommand } from '@/zoho-projects/commands/tasks'
import { pullIssuesCommand } from '@/zoho-projects/commands/issues'
import { renderTasksCommand } from '@/zoho-projects/commands/tasks-render'
import { renderIssuesCommand } from '@/zoho-projects/commands/issues-render'

const program = new Command()

program.name('zoho-studio')

program.addCommand(initCommand)
program.addCommand(loginCommand)
program.addCommand(authMigrateLegacyCommand)
program.addCommand(statusCommand)
program.addCommand(orgInfoCommand)
program.addCommand(debugCommand)
program.addCommand(pullFunctionsCommand)
program.addCommand(pullModulesCommand)
program.addCommand(pullFieldsCommand)
program.addCommand(pullWorkflowsCommand)
program.addCommand(pullWebhooksCommand)
program.addCommand(pullWorkflowActionsCommand)
program.addCommand(pullGlobalPicklistsCommand)
program.addCommand(pullClientScriptsCommand)
program.addCommand(pullStaticResourcesCommand)
program.addCommand(pullMilestonesCommand)
program.addCommand(pullTaskListsCommand)
program.addCommand(pullTasksCommand)
program.addCommand(pullIssuesCommand)
program.addCommand(renderTasksCommand)
program.addCommand(renderIssuesCommand)
program.addCommand(browserCommand)
program.addCommand(presetCommand)

try {
    await program.parseAsync()
} catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
}
