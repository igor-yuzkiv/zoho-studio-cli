import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import {
    assertModuleName,
    describeRequestError,
    removeModuleRuleFiles,
    resolveRuleFileName,
    sortWorkflowRules,
} from '@/commands/workflows/pull-workflows.command'

describe('assertModuleName', () => {
    test('accepts a plain module API name', () => {
        expect(assertModuleName('Deals')).toBe('Deals')
        expect(assertModuleName('CustomModule1')).toBe('CustomModule1')
    })

    test('rejects a value that is not a single path segment', () => {
        expect(() => assertModuleName('')).toThrow(/must be a module API name/)
        expect(() => assertModuleName('.')).toThrow(/must be a module API name/)
        expect(() => assertModuleName('..')).toThrow(/must be a module API name/)
        expect(() => assertModuleName('../Deals')).toThrow(/must be a module API name/)
        expect(() => assertModuleName('crm/Deals')).toThrow(/must be a module API name/)
        expect(() => assertModuleName('crm\\Deals')).toThrow(/must be a module API name/)
    })
})

describe('resolveRuleFileName', () => {
    test('names the file after the rule', () => {
        expect(resolveRuleFileName('Big Deal Rule', '1', new Set())).toBe('Big Deal Rule.json')
    })

    test('keeps the file name a single path segment', () => {
        expect(resolveRuleFileName('Deals/Won', '1', new Set())).toBe('Deals_Won.json')
    })

    test('adds the rule id when the name is already taken', () => {
        expect(resolveRuleFileName('Upsert', '2', new Set(['Upsert.json']))).toBe('Upsert.2.json')
    })

    test('falls back to the rule id when the name leaves no usable file name', () => {
        expect(resolveRuleFileName('..', '7', new Set())).toBe('7.json')
        expect(resolveRuleFileName('   ', '7', new Set())).toBe('7.json')
    })
})

describe('sortWorkflowRules', () => {
    test('orders by module, then name, then id so collisions resolve the same way each run', () => {
        const rules = [
            { id: '9', name: 'Upsert', module: { api_name: 'Leads' } },
            { id: '3', name: 'Upsert', module: { api_name: 'Deals' } },
            { id: '1', name: 'Alert', module: { api_name: 'Deals' } },
        ]

        expect(sortWorkflowRules(rules).map((rule) => rule.id)).toEqual(['1', '3', '9'])
    })

    test('leaves the given list untouched', () => {
        const rules = [
            { id: '2', name: 'B', module: { api_name: 'Deals' } },
            { id: '1', name: 'A', module: { api_name: 'Deals' } },
        ]

        sortWorkflowRules(rules)

        expect(rules.map((rule) => rule.id)).toEqual(['2', '1'])
    })
})

describe('removeModuleRuleFiles', () => {
    let workflowsPath = ''

    beforeEach(async () => {
        workflowsPath = join(await mkdtemp(join(tmpdir(), 'zoho-studio-workflows-')), 'workflows')
    })

    afterEach(async () => {
        await rm(workflowsPath, { recursive: true, force: true })
    })

    async function writeRuleFile(fileName: string, rule: unknown): Promise<void> {
        await Bun.write(join(workflowsPath, fileName), JSON.stringify(rule))
    }

    test('drops only the rules of the asked module and reports the surviving file names', async () => {
        await writeRuleFile('Deals Alert.json', { id: '1', name: 'Deals Alert', module: { api_name: 'Deals' } })
        await writeRuleFile('Leads Alert.json', { id: '2', name: 'Leads Alert', module: { api_name: 'Leads' } })

        expect(await removeModuleRuleFiles(workflowsPath, 'Deals')).toEqual(new Set(['Leads Alert.json']))
        expect(await readdir(workflowsPath)).toEqual(['Leads Alert.json'])
    })

    test('leaves a file that cannot be read as a rule alone', async () => {
        await Bun.write(join(workflowsPath, 'broken.json'), 'not json')
        await writeRuleFile('no-module.json', { id: '3', name: 'No Module' })

        expect(await removeModuleRuleFiles(workflowsPath, 'Deals')).toEqual(
            new Set(['broken.json', 'no-module.json'])
        )
        expect((await readdir(workflowsPath)).sort()).toEqual(['broken.json', 'no-module.json'])
    })

    test('creates the directory when the first pull of a module runs into nothing', async () => {
        expect(await removeModuleRuleFiles(workflowsPath, 'Deals')).toEqual(new Set())
        expect(await readdir(workflowsPath)).toEqual([])
    })
})

describe('describeRequestError', () => {
    test('prefers what Zoho put in the response body over the HTTP status', () => {
        const error = Object.assign(new Error('Request failed with status code 400'), {
            response: { data: { message: 'The value provided to the param is Invalid', code: 'INVALID_MODULE' } },
        })

        expect(describeRequestError(error)).toBe('The value provided to the param is Invalid (INVALID_MODULE)')
    })

    test('falls back to the error message when there is no Zoho payload', () => {
        expect(describeRequestError(new Error('socket hang up'))).toBe('socket hang up')
        expect(describeRequestError('broken')).toBe('broken')
    })
})
