import { Command } from 'commander'

import { initCommand } from '@/commands/init'
import { loginCommand } from '@/commands/login'
import { statusCommand } from '@/commands/status'
import { debugCommand } from '@/commands/debug'
import { pullFunctionsCommand } from '@/commands/functions'
import { pullModulesCommand } from '@/commands/modules'
import { pullFieldsCommand } from '@/commands/fields'
import { pullWorkflowsCommand } from '@/commands/workflows'

const program = new Command()

program.name('zoho-studio')

program.addCommand(initCommand)
program.addCommand(loginCommand)
program.addCommand(statusCommand)
program.addCommand(debugCommand);
program.addCommand(pullFunctionsCommand)
program.addCommand(pullModulesCommand)
program.addCommand(pullFieldsCommand)
program.addCommand(pullWorkflowsCommand)

try {
    await program.parseAsync()
} catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
}
