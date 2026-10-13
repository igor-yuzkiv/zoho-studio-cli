import { Command } from 'commander'

import { initCommand } from '@/commands/init'
import { loginCommand } from '@/commands/login'
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

const program = new Command()

program.name('zoho-studio')

program.addCommand(initCommand)
program.addCommand(loginCommand)
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
program.addCommand(browserCommand)
program.addCommand(presetCommand)

try {
    await program.parseAsync()
} catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
}
