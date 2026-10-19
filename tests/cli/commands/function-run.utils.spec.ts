import { describe, expect, test } from 'bun:test'

import {
    buildFunctionRunCommandLine,
    collectFunctionArgument,
    findUnknownArguments,
} from '@/commands/zoho-crm/functions/run/function-run.utils'

describe('collectFunctionArgument', () => {
    test('folds repeated --arg name=value into one map, keeping "=" in the value', () => {
        const args = collectFunctionArgument('filter=a=b', collectFunctionArgument('id=1123', {}))

        expect(args).toEqual({ id: '1123', filter: 'a=b' })
    })

    test('takes an empty value', () => {
        expect(collectFunctionArgument('note=', {})).toEqual({ note: '' })
    })

    test('refuses an argument without a name', () => {
        expect(() => collectFunctionArgument('1123', {})).toThrow('--arg takes name=value, got "1123".')
        expect(() => collectFunctionArgument('=1123', {})).toThrow('--arg takes name=value')
    })
})

describe('findUnknownArguments', () => {
    test('names the arguments the declaration does not have', () => {
        const parameters = [{ type: 'String', name: 'id' }]

        expect(findUnknownArguments(parameters, { id: '1', count: '2' })).toEqual(['count'])
        expect(findUnknownArguments(parameters, { id: '1' })).toEqual([])
    })
})

describe('buildFunctionRunCommandLine', () => {
    test('prints a command that runs the function with the same arguments', () => {
        expect(buildFunctionRunCommandLine('btn_send', 'src', { id: '1123' })).toBe(
            'zoho-studio z-crm:functions:run btn_send --from src --arg id=1123'
        )
    })

    test('quotes values a shell would split or expand', () => {
        expect(buildFunctionRunCommandLine('btn_send', 'data', { note: "it's done", filter: '{"a":1}' })).toBe(
            `zoho-studio z-crm:functions:run btn_send --from data --arg 'note=it'\\''s done' --arg 'filter={"a":1}'`
        )
    })
})
