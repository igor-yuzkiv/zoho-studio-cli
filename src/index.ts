import { Command } from 'commander'

import { debugCommand } from '@/commands/debug'
import { initCommand } from '@/commands/init'

const program = new Command()

program.name('zoho-studio')

program.addCommand(debugCommand)
program.addCommand(initCommand)

await program.parseAsync()
