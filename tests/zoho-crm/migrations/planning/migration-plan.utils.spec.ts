import { describe, expect, test } from 'bun:test'

import { buildMigrationPlan, defineMigration, describeMigration } from '@zoho-studio/zoho-crm/migrations'

describe('buildMigrationPlan', () => {
    test('creates the module first, then its fields in batches of 25', () => {
        const migration = defineMigration({
            create: {
                api_name: 'Invoices',
                singular_label: 'Invoice',
                plural_label: 'Invoices',
                fields: (schema) => {
                    for (let index = 1; index <= 26; index += 1) schema.text(`Field ${index}`)
                },
            },
        })

        const plan = buildMigrationPlan(describeMigration(migration), ['100'])

        expect(plan.steps.map((step) => step.kind)).toEqual(['create-module', 'create-fields', 'create-fields'])
        expect(plan.steps[0]).toEqual({
            kind: 'create-module',
            module: { api_name: 'Invoices', singular_label: 'Invoice', plural_label: 'Invoices', profiles: [{ id: '100' }] },
        })
        expect(plan.steps[1]).toMatchObject({ kind: 'create-fields', module: 'Invoices' })
        expect(plan.steps.map((step) => (step.kind === 'create-fields' ? step.fields.length : 0))).toEqual([0, 25, 1])
    })

    test('leaves the module of the field steps open when Zoho names the new module', () => {
        const migration = defineMigration({
            create: { singular_label: 'Invoice', plural_label: 'Invoices', fields: (schema) => schema.text('Code') },
        })

        expect(buildMigrationPlan(describeMigration(migration), ['100']).steps[1]).toMatchObject({ module: null })
    })

    test('only adds fields to the module of an update', () => {
        const migration = defineMigration({ update: { module: 'Projects', fields: (schema) => schema.text('Code') } })

        expect(buildMigrationPlan(describeMigration(migration), []).steps).toEqual([
            { kind: 'create-fields', module: 'Projects', fields: [{ field_label: 'Code', data_type: 'text' }] },
        ])
    })
})
