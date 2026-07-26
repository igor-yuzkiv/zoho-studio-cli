import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { resolveFunctionsRootPath } from '@/commands/functions/pull-functions.command'

const projectPath = '/tmp/zoho-project'

describe('resolveFunctionsRootPath', () => {
    test('resolves a relative directory against the project root', () => {
        expect(resolveFunctionsRootPath(projectPath, 'functions')).toBe(join(projectPath, 'functions'))
        expect(resolveFunctionsRootPath(projectPath, 'crm/functions')).toBe(join(projectPath, 'crm', 'functions'))
    })

    test('rejects an absolute path', () => {
        expect(() => resolveFunctionsRootPath(projectPath, '/etc')).toThrow(/must be relative/)
    })

    test('rejects a path escaping the project', () => {
        expect(() => resolveFunctionsRootPath(projectPath, '../elsewhere')).toThrow(/must point inside/)
        expect(() => resolveFunctionsRootPath(projectPath, 'crm/../../elsewhere')).toThrow(/must point inside/)
    })

    test('rejects a path resolving to the project root itself', () => {
        expect(() => resolveFunctionsRootPath(projectPath, '')).toThrow(/must point inside/)
        expect(() => resolveFunctionsRootPath(projectPath, '.')).toThrow(/must point inside/)
    })
})
