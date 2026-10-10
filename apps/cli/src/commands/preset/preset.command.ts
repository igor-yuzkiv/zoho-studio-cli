import { Command } from 'commander'

import { getProjectSettings } from '@zoho-studio/core'
import { createCommandLogger } from '@zoho-studio/core'

import { splitPresetEntry } from './preset.utils'

export const presetCommand = new Command('preset')
    .description('Run a named sequence of commands from the presets in the project settings')
    .argument('[name]', 'preset to run; without it the available presets are listed')
    .action(async function (this: Command, name: string | undefined) {
        const { settings } = await getProjectSettings()
        const presets = settings.presets ?? {}

        if (!name) {
            for (const [presetName, entries] of Object.entries(presets)) {
                console.log(`${presetName}: ${entries.join(', ')}`)
            }

            return
        }

        const entries = presets[name]

        if (!entries) {
            throw new Error(`Unknown preset "${name}". Available: ${Object.keys(presets).join(', ') || 'none'}`)
        }

        const commandLines = entries.map(splitPresetEntry).filter((args) => args.length > 0)
        const nestedPreset = commandLines.find((args) => args[0] === presetCommand.name())

        // A preset calling a preset could loop forever, and nothing a preset needs requires it.
        if (nestedPreset) {
            throw new Error(`Preset "${name}" runs "${nestedPreset.join(' ')}"; a preset cannot run another preset.`)
        }

        const program = this.parent

        if (!program) {
            throw new Error('The preset command is not registered on the CLI program.')
        }

        // Commander exits the process on an unknown command, so a typo must surface before step one runs.
        const unknownCommand = commandLines.find(
            (args) => !program.commands.some((command) => command.name() === args[0])
        )

        if (unknownCommand) {
            throw new Error(`Preset "${name}" runs "${unknownCommand.join(' ')}", which is not a zoho-studio command.`)
        }

        const logger = await createCommandLogger('preset')
        logger.info({ preset: name, steps: commandLines.length }, 'Starting preset')

        for (const [index, args] of commandLines.entries()) {
            console.log(`\n[${index + 1}/${commandLines.length}] zoho-studio ${args.join(' ')}`)

            try {
                await program.parseAsync(args, { from: 'user' })
            } catch (error) {
                logger.error({ err: error, preset: name, step: args.join(' ') }, 'Preset step failed')
                throw new Error(
                    `Preset "${name}" stopped at step ${index + 1} (${args.join(' ')}): ${error instanceof Error ? error.message : String(error)}`,
                    { cause: error }
                )
            }
        }

        logger.info({ preset: name }, 'Preset finished')
        console.log(`\nPreset "${name}" finished: ${commandLines.length} steps`)
    })
