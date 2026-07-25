import { Command } from 'commander'

import { initCommand } from '@/commands/init'

const program = new Command()

program.name('zoho-studio')

program.addCommand(initCommand)

await program.parseAsync()
