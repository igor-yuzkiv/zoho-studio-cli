import { join } from 'node:path'

import { describe, expect, test } from 'bun:test'

import { resolveMetadataPath } from '@/commands/modules/pull-modules.command'

const modulesPath = '/tmp/zoho-project/modules'

describe('resolveMetadataPath', () => {
    test('names both the directory and the file after the module API name', () => {
        expect(resolveMetadataPath(modulesPath, 'Leads')).toBe(join(modulesPath, 'Leads', 'Leads.metadata.json'))
    })

    test('keeps each name a single path segment', () => {
        expect(resolveMetadataPath(modulesPath, 'crm/Leads')).toBe(
            join(modulesPath, 'crm_Leads', 'crm_Leads.metadata.json')
        )
    })
})
