import { Command } from 'commander'

import { initCommand } from '@/commands/init'
import { loginCommand } from '@/commands/login'
import { statusCommand } from '@/commands/zoho-crm/status'
import { orgInfoCommand } from '@/commands/zoho-crm/org'
import { debugCommand } from '@/commands/debug'
import { presetCommand } from '@/commands/preset'
import { pullFunctionsCommand } from '@/commands/zoho-crm/functions'
import { pullModulesCommand } from '@/commands/zoho-crm/modules'
import { pullFieldsCommand } from '@/commands/zoho-crm/fields'
import { pullWorkflowsCommand } from '@/commands/zoho-crm/workflows'
import { pullWebhooksCommand } from '@/commands/zoho-crm/webhooks'
import { pullWorkflowActionsCommand } from '@/commands/zoho-crm/workflow-actions'
import { pullGlobalPicklistsCommand } from '@/commands/zoho-crm/global-picklists'
import { pullClientScriptsCommand } from '@/commands/zoho-crm/client-scripts'
import { pullStaticResourcesCommand } from '@/commands/zoho-crm/static-resources'
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
