import { describe, expect, test } from 'bun:test'
import { Command } from 'commander'

import { resolveSyncSteps, runSyncSequence } from '@/commands/sync/sync.service'

function buildProgram(stepNames: string[], failingStep?: { name: string; message: string }) {
    const executed: string[] = []
    const program = new Command()

    for (const stepName of stepNames) {
        program.addCommand(
            new Command(stepName).action(async () => {
                executed.push(stepName)

                if (failingStep?.name === stepName) {
                    throw new Error(failingStep.message)
                }
            })
        )
    }

    program.addCommand(new Command('sync'))

    return { program, executed }
}

const ignoreStepStart = () => {}

describe('resolveSyncSteps', () => {
    test('resolves the names to the commands registered on the program', () => {
        const { program } = buildProgram(['modules:pull', 'fields:pull'])

        const steps = resolveSyncSteps(program, ['fields:pull', 'modules:pull'])

        expect(steps.map((step) => step.name())).toEqual(['fields:pull', 'modules:pull'])
    })

    test('rejects an unknown command name', () => {
        const { program } = buildProgram(['modules:pull'])

        expect(() => resolveSyncSteps(program, ['modules:pull', 'modules:pul'])).toThrow(
            'sync.commands names an unknown command: "modules:pul".'
        )
    })

    test('rejects sync itself, which would run forever', () => {
        const { program } = buildProgram(['modules:pull'])

        expect(() => resolveSyncSteps(program, ['modules:pull', 'sync'])).toThrow(
            'sync.commands must not contain "sync" itself.'
        )
    })
})

describe('runSyncSequence', () => {
    test('runs the steps in the configured order', async () => {
        const { program, executed } = buildProgram(['modules:pull', 'fields:pull', 'functions:pull'])

        await runSyncSequence(program, ['functions:pull', 'modules:pull', 'fields:pull'], ignoreStepStart)

        expect(executed).toEqual(['functions:pull', 'modules:pull', 'fields:pull'])
    })

    test('reports every step before it runs', async () => {
        const { program } = buildProgram(['modules:pull', 'fields:pull'])
        const started: [string, number][] = []

        await runSyncSequence(program, ['modules:pull', 'fields:pull'], (commandName, index) => {
            started.push([commandName, index])
        })

        expect(started).toEqual([
            ['modules:pull', 0],
            ['fields:pull', 1],
        ])
    })

    test('stops at the first failed step and names it', async () => {
        const { program, executed } = buildProgram(['modules:pull', 'fields:pull', 'functions:pull'], {
            name: 'fields:pull',
            message: 'Zoho refused the request',
        })

        const run = runSyncSequence(program, ['modules:pull', 'fields:pull', 'functions:pull'], ignoreStepStart)

        await expect(run).rejects.toThrow('Sync stopped at "fields:pull": Zoho refused the request')
        expect(executed).toEqual(['modules:pull', 'fields:pull'])
    })

    test('validates the whole list before running anything', async () => {
        const { program, executed } = buildProgram(['modules:pull', 'fields:pull'])

        await expect(runSyncSequence(program, ['modules:pull', 'nope:pull'], ignoreStepStart)).rejects.toThrow(
            'unknown command'
        )

        expect(executed).toEqual([])
    })
})
