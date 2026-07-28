import { join } from 'node:path'

import { describe, expect, test } from 'bun:test'

import { resolveProjectDirPath } from '@/shared/utils'

const projectPath = '/tmp/zoho-studio-project'
const settingName = 'crm.functions.root_dir'

describe('resolveProjectDirPath', () => {
    test('resolves a relative directory against the project root', () => {
        expect(resolveProjectDirPath(projectPath, 'functions', settingName)).toBe(join(projectPath, 'functions'))
        expect(resolveProjectDirPath(projectPath, 'crm/functions', settingName)).toBe(
            join(projectPath, 'crm', 'functions')
        )
    })

    test('refuses an absolute directory', () => {
        expect(() => resolveProjectDirPath(projectPath, '/etc', settingName)).toThrow(/must be relative/)
    })

    test('refuses a directory outside the project', () => {
        expect(() => resolveProjectDirPath(projectPath, '../elsewhere', settingName)).toThrow(/must point inside/)
        expect(() => resolveProjectDirPath(projectPath, 'crm/../../elsewhere', settingName)).toThrow(
            /must point inside/
        )
    })

    test('refuses the project root itself', () => {
        expect(() => resolveProjectDirPath(projectPath, '', settingName)).toThrow(/must point inside/)
        expect(() => resolveProjectDirPath(projectPath, '.', settingName)).toThrow(/must point inside/)
    })

    test('names the offending setting in the error', () => {
        expect(() => resolveProjectDirPath(projectPath, '/etc', 'crm.modules.root_dir')).toThrow(
            /crm\.modules\.root_dir/
        )
    })
})
