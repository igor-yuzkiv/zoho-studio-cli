import { describe, expect, test } from 'bun:test'

import { moduleMetadataFilePath } from '@zoho-studio/zoho-crm/module'

describe('moduleMetadataFilePath', () => {
    test('names both the directory and the file after the module API name', () => {
        expect(moduleMetadataFilePath('Leads')).toEqual(['zoho-crm', 'modules', 'Leads', 'Leads.metadata.json'])
    })

    test('keeps each name a single path segment', () => {
        expect(moduleMetadataFilePath('crm/Leads')).toEqual(['zoho-crm', 'modules', 'crm_Leads', 'crm_Leads.metadata.json'])
    })
})
