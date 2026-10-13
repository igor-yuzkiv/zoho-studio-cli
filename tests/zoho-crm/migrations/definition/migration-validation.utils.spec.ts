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

    test('limits an info icon tooltip to 255 characters and a static text one to 35', () => {
        const migration = updateWith((schema) => {
            schema.text('Code', { tooltip: '' })
            schema.text('Name', { tooltip: 'z'.repeat(256) })
            schema.text('Ref', { tooltip: { type: 'static_text', text: 'z'.repeat(36) } })
        })

        expect(validateMigration(migration)).toEqual([
            'Field "Code": the tooltip must be 1 to 255 characters.',
            'Field "Name": the tooltip must be 1 to 255 characters.',
            'Field "Ref": a static_text tooltip must be 1 to 35 characters.',
        ])
    })

    test('allows a static text tooltip only on the types Zoho accepts it for', () => {
        const migration = updateWith((schema) => {
            schema.currency('Budget', { tooltip: { type: 'static_text', text: 'Hint' } })
            schema.date('Deadline', { tooltip: { type: 'static_text', text: 'Hint' } })
        })

        expect(validateMigration(migration)).toEqual([
            'Field "Deadline": a static_text tooltip is not supported for date fields; give the text alone for an info icon.',
        ])
    })

    test('rejects an option the field type does not have', () => {
        const migration = updateWith((schema) => {
            schema.double('Rate', { decimal_places: 2 } as never)
        })

        expect(validateMigration(migration)).toEqual(['Field "Rate": unknown option "decimal_places".'])
    })

    test('rejects an option value of the wrong type', () => {
        const migration = updateWith((schema) => {
            schema.text('Code', { length: '50' } as never)
            schema.picklist('Stage', { values: 'New' } as never)
        })

        expect(validateMigration(migration)).toEqual([
            'Field "Code": length must be a whole number from 1 to 50000.',
            'Field "Stage": values must be a list of strings or { display_value, actual_value } pairs.',
        ])
    })

    test('rejects an unknown key of the action and fields that are not a function', () => {
        const migration = {
            create: { singular_label: 'Project', plural_label: 'Projects', fields: [], color: 'red' },
        } as never

        expect(validateMigration(migration)).toEqual([
            'create: fields must be a function that declares the fields.',
            'create: unknown option "color".',
        ])
    })
})
