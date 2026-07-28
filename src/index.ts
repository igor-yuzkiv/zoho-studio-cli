import { Command } from 'commander'

import { initCommand } from '@/commands/init'
import { loginCommand } from '@/commands/login'
import { statusCommand } from '@/commands/status'
import { debugCommand } from '@/commands/debug'
import { pullFunctionsCommand } from '@/commands/functions'
import { pullModulesCommand } from '@/commands/modules'

const program = new Command()

program.name('zoho-studio')

program.addCommand(initCommand)
program.addCommand(loginCommand)
program.addCommand(statusCommand)
program.addCommand(debugCommand);
program.addCommand(pullFunctionsCommand)
program.addCommand(pullModulesCommand)

try {
    await program.parseAsync()
} catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
}
