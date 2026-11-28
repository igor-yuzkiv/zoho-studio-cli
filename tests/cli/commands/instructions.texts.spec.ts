import { describe, expect, test } from 'bun:test'

import {
    instructionTextKey,
    listNamespaces,
    overviewTextKey,
    type CommandSummary,
} from '@/commands/instructions/instructions.service'
import { instructionTexts } from '@/commands/instructions/instructions.texts'
import { createProgram } from '@/program'

const commands: CommandSummary[] = createProgram().commands.map((command) => ({
    name: command.name(),
    summary: command.description(),
}))

describe('instruction texts', () => {
    test('every registered command has a text', () => {
        const missing = commands.map((command) => command.name).filter((name) => !instructionTexts[instructionTextKey(name)])

        expect(missing).toEqual([])
    })

    test('every text belongs to a command, a group of commands, or the overview', () => {
        const knownKeys = new Set([
            overviewTextKey,
            ...commands.map((command) => instructionTextKey(command.name)),
            ...listNamespaces(commands).map(instructionTextKey),
        ])

        expect(Object.keys(instructionTexts).filter((key) => !knownKeys.has(key))).toEqual([])
    })

    test('a command text starts with the command name as its heading', () => {
        const misnamed = commands
            .map((command) => command.name)
            .filter((name) => !instructionTexts[instructionTextKey(name)]?.startsWith(`# ${name}\n`))

        expect(misnamed).toEqual([])
    })
})
