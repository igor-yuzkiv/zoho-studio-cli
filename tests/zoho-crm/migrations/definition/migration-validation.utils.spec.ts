import { describe, expect, test } from 'bun:test'

import { defineMigration, validateMigration, type FieldsDeclaration } from '@zoho-studio/zoho-crm/migrations'

const createProjects = defineMigration({
    create: {
        api_name: 'Projects',
        singular_label: 'Project',
        plural_label: 'Projects',
        fields: (schema) => schema.text('Code'),
    },
})

function updateWith(declaration: FieldsDeclaration) {
    return defineMigration({ update: { module: 'Projects', fields: declaration } })
}

describe('validateMigration', () => {
    test('accepts a valid migration', () => {
        expect(validateMigration(createProjects)).toEqual([])
    })

    test('requires exactly one action', () => {
        expect(validateMigration({} as never)).toEqual(['A migration must declare exactly one action: create or update.'])
        expect(
            validateMigration({ create: createProjects.create, update: { module: 'Projects', fields: () => {} } } as never)
        ).toEqual(['A migration must declare exactly one action: create or update.'])
    })

    test('limits module labels to 50 characters and checks the module API name', () => {
        const migration = defineMigration({
            create: { api_name: 'Bad__Name', singular_label: 'x'.repeat(51), plural_label: '', fields: () => {} },
        })

        expect(validateMigration(migration)).toEqual([
            'Module API name "Bad__Name" must start with a letter and hold only letters, digits and single underscores, not ending with one.',
            'Module singular_label must be 1 to 50 characters.',
            'Module plural_label must be 1 to 50 characters.',
        ])
    })

    test('requires at least one field in an update', () => {
        expect(validateMigration(updateWith(() => {}))).toEqual(['An update must add at least one field.'])
    })

    test('limits field labels to 25 characters and checks field API names', () => {
        const migration = updateWith((schema) => {
            schema.text('x'.repeat(26))
            schema.text('Code', { api_name: '1Code' })
            schema.text('Name', { api_name: 'Name_' })
        })

        expect(validateMigration(migration)).toEqual([
            `Field "${'x'.repeat(26)}": the label must be 1 to 25 characters.`,
            'Field "Code": API name "1Code" must start with a letter and hold only letters, digits and single underscores, not ending with one.',
            'Field "Name": API name "Name_" must start with a letter and hold only letters, digits and single underscores, not ending with one.',
        ])
    })

    test('rejects labels and API names declared twice, regardless of case', () => {
        const migration = updateWith((schema) => {
            schema.text('Code', { api_name: 'Ref' })
            schema.text('code')
            schema.integer('Number', { api_name: 'ref' })
        })

        expect(validateMigration(migration)).toEqual([
            'Field "code": the label is declared more than once.',
            'Field "Number": API name "ref" is declared more than once.',
        ])
    })

    test('checks picklist values', () => {
        const migration = updateWith((schema) => {
            schema.picklist('Empty', { values: [] })
            schema.multiselectpicklist('Stage', { values: ['New', 'New', 'y'.repeat(26)] })
        })

        expect(validateMigration(migration)).toEqual([
            'Field "Empty": a picklist needs at least one value.',
            'Field "Stage": picklist value "New" is declared more than once.',
            `Field "Stage": picklist value "${'y'.repeat(26)}" must be 1 to 25 characters.`,
        ])
    })

    test('checks number options', () => {
        const migration = updateWith((schema) => {
            schema.double('Rate', { decimal_place: 10 })
            schema.text('Code', { length: 0 })
            schema.phone('Phone', { length: 50001 })
        })

        expect(validateMigration(migration)).toEqual([
            'Field "Rate": decimal_place must be a whole number from 0 to 9.',
            'Field "Code": length must be a whole number from 1 to 50000.',
            'Field "Phone": length must be a whole number from 1 to 50000.',
        ])
    })

    test('requires the target module of a lookup', () => {
        expect(validateMigration(updateWith((schema) => schema.lookup('Account', { module: '' })))).toEqual([
            'Field "Account": a lookup needs the API name of its target module.',
        ])
    })

    test('reports a fields declaration that throws', () => {
        const migration = updateWith(() => {
            throw new Error('boom')
        })

        expect(validateMigration(migration)).toEqual(['The fields declaration failed: boom'])
    })
})
