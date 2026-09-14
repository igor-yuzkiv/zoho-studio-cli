import type { Command } from 'commander'

export const syncCommandName = 'sync'

/**
 * Resolves against the commands registered on the program, so a typo in the settings fails before
 * the first request goes out rather than halfway through a run.
 */
export function resolveSyncSteps(program: Command, commandNames: string[]): Command[] {
    return commandNames.map((commandName) => {
        if (commandName === syncCommandName) {
            throw new Error(`sync.commands must not contain "${syncCommandName}" itself.`)
        }

        const step = program.commands.find((command) => command.name() === commandName)

        if (!step) {
            throw new Error(`sync.commands names an unknown command: "${commandName}".`)
        }

        return step
    })
}

/** Stops at the first failed step: the later steps usually read what an earlier one wrote. */
export async function runSyncSequence(
    program: Command,
    commandNames: string[],
    onStepStart: (commandName: string, index: number) => void
): Promise<void> {
    const steps = resolveSyncSteps(program, commandNames)

    for (const [index, step] of steps.entries()) {
        onStepStart(step.name(), index)

        try {
            await step.parseAsync([], { from: 'user' })
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)

            throw new Error(`Sync stopped at "${step.name()}": ${message}`, { cause: error })
        }
    }
}
