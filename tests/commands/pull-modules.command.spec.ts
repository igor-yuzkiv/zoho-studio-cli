import { describe, expect, test } from 'bun:test'

import { resolveMetadataSegments } from '@/commands/modules/pull-modules.command'

describe('resolveMetadataSegments', () => {
    test('names both the directory and the file after the module API name', () => {
        expect(resolveMetadataSegments('Leads')).toEqual(['modules', 'Leads', 'Leads.metadata.json'])
    })

    test('keeps each name a single path segment', () => {
        expect(resolveMetadataSegments('crm/Leads')).toEqual(['modules', 'crm_Leads', 'crm_Leads.metadata.json'])
    })
})
