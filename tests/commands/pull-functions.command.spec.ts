import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { resolveCodeFileName, resolveFunctionsRootPath } from '@/commands/functions/pull-functions.command'

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

describe('resolveCodeFileName', () => {
    test('appends the configured extension to the function name', () => {
        expect(resolveCodeFileName('Calculate Invoice Total', 'deluge')).toBe('Calculate Invoice Total.deluge')
        expect(resolveCodeFileName('Calculate Invoice Total', 'dg')).toBe('Calculate Invoice Total.dg')
    })

    test('accepts an extension written with a leading dot', () => {
        expect(resolveCodeFileName('Send Invoice', '.deluge')).toBe('Send Invoice.deluge')
    })

    test('leaves the name bare when no extension is configured', () => {
        expect(resolveCodeFileName('Send Invoice', '')).toBe('Send Invoice')
        expect(resolveCodeFileName('Send Invoice', '.')).toBe('Send Invoice')
    })

    test('keeps the file name a single path segment', () => {
        expect(resolveCodeFileName('reports/monthly', 'deluge')).toBe('reports_monthly.deluge')
        expect(resolveCodeFileName('Send Invoice', 'deluge/js')).toBe('Send Invoice.deluge_js')
    })
})
