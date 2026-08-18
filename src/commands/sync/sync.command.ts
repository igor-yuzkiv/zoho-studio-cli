import { Command } from 'commander'

import { getProjectSettings } from '@/settings'
import { createCommandLogger } from '@/shared/logger'

import { runSyncSequence, syncCommandName } from './sync.service'

export const syncCommand = new Command(syncCommandName)
    .description('Run the pull commands listed in the project settings, one after another')
    .action(async (_options: unknown, command: Command) => {
        const logger = await createCommandLogger(syncCommandName)

        const { settings } = await getProjectSettings()
        const commandNames = settings.sync.commands

        if (commandNames.length === 0) {
            logger.info('Sync finished with nothing to run')
            console.log('sync.commands is empty — nothing to run.')

            return
        }

        // The steps are the sibling commands, so the program is the only registry sync needs.
        const program = command.parent

        if (!program) {
            throw new Error('The sync command must be registered on the program before it runs.')
        }

        logger.info({ commands: commandNames }, 'Starting sync')

        try {
            await runSyncSequence(program, commandNames, (commandName, index) => {
                console.log(`\n[${index + 1}/${commandNames.length}] ${commandName}`)
            })

            logger.info({ steps: commandNames.length }, 'Sync finished')

            console.log(`\nSteps completed: ${commandNames.length}`)
        } catch (error) {
            logger.error({ err: error }, 'Sync failed')

            throw error
        }
    })
