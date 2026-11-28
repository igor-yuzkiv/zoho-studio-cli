import { Command } from 'commander'

import { renderInstructions, type CommandSummary } from './instructions.service'
import { instructionTexts } from './instructions.texts'

export const instructionsCommand = new Command('instructions')
    .description('Print instructions for agents: the project, a group of commands, or one command')
    .argument('[name]', 'a command or a group of commands, such as z-crm:functions:pull, z-crm:functions or z-crm')
    .action(function (this: Command, name: string | undefined) {
        const commands: CommandSummary[] = (this.parent?.commands ?? []).map((command) => ({
            name: command.name(),
            summary: command.description(),
        }))

        console.log(renderInstructions(name, commands, instructionTexts))
    })
