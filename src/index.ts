import { Command } from 'commander'

import { debugCommand } from '@/commands/debug'
import { initCommand } from '@/commands/init'
import { loginCommand } from '@/commands/login'

const program = new Command()

program.name('zoho-studio')

program.addCommand(debugCommand)
program.addCommand(initCommand)
program.addCommand(loginCommand)

try {
    await program.parseAsync()
} catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
}
