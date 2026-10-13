import { describe, expect, test } from 'bun:test'

import { defineMigration, describeMigration } from '@zoho-studio/zoho-crm/migrations'

const createProjects = defineMigration({
    create: {
        api_name: 'Projects',
        singular_label: 'Project',
        plural_label: 'Projects',
        fields: (schema) => schema.text('Code'),
    },
})

describe('describeMigration', () => {
    test('describes a create with the Administrator profile when none is named', () => {
        expect(describeMigration(createProjects)).toEqual({
            action: 'create',
            module: { api_name: 'Projects', singular_label: 'Project', plural_label: 'Projects' },
            profiles: ['Administrator'],
            fields: [{ field_label: 'Code', data_type: 'text' }],
        })
    })

    test('keeps the named profiles of a create', () => {
        const migration = defineMigration({
            create: { singular_label: 'Project', plural_label: 'Projects', profiles: ['Standard'], fields: () => {} },
        })

        expect(describeMigration(migration)).toMatchObject({ profiles: ['Standard'] })
    })

    test('describes an update of an existing module', () => {
        const migration = defineMigration({ update: { module: 'Projects', fields: (schema) => schema.boolean('Done') } })

        expect(describeMigration(migration)).toEqual({
            action: 'update',
            module: { api_name: 'Projects' },
            fields: [{ field_label: 'Done', data_type: 'boolean' }],
        })
    })
})
