import { describe, expect, test } from 'bun:test'

import {
    buildMigrationStub,
    buildNextMigrationName,
    proposeSingularLabel,
    toMigrationNameSegment,
    validateModuleApiName,
    validateModuleLabel,
} from '@zoho-studio/zoho-crm/migrations'

describe('toMigrationNameSegment', () => {
    test('turns labels and API names into kebab case', () => {
        expect(toMigrationNameSegment('Customer Orders')).toBe('customer-orders')
        expect(toMigrationNameSegment('Customer_Orders')).toBe('customer-orders')
        expect(toMigrationNameSegment('CustomerOrders')).toBe('customer-orders')
        expect(toMigrationNameSegment('  Projects & Tasks! ')).toBe('projects-tasks')
    })
})

describe('buildNextMigrationName', () => {
    const create = { action: 'create', singular_label: 'Project', plural_label: 'Projects' } as const

    test('starts at 001 in an empty folder', () => {
        expect(buildNextMigrationName([], create)).toBe('001-create-projects')
    })

    test('follows the highest number, ignoring names without one', () => {
        expect(
            buildNextMigrationName(['001-create-projects', '007-add-budget', 'notes'], {
                action: 'update',
                module: 'Deals',
            })
        ).toBe('008-update-deals')
    })

    test('keeps the width of the numbering the project already uses, so the new name sorts last', () => {
        expect(buildNextMigrationName(['0009-create-projects'], create)).toBe('0010-create-projects')
        expect(buildNextMigrationName(['1-a', '2-b'], create)).toBe('3-create-projects')
        expect(buildNextMigrationName(['01-a', '09-b'], create)).toBe('10-create-projects')

        const names = ['01-a', '09-b', buildNextMigrationName(['01-a', '09-b'], create)]
        expect([...names].sort()).toEqual(names)
    })

    test('falls back to a generic segment when the label has no letters or digits', () => {
        expect(buildNextMigrationName([], { action: 'create', singular_label: 'Ж', plural_label: 'Жж' })).toBe(
            '001-create-module'
        )
    })
})

describe('proposeSingularLabel', () => {
    test('drops the plural ending', () => {
        expect(proposeSingularLabel('Projects')).toBe('Project')
        expect(proposeSingularLabel('Companies')).toBe('Company')
        expect(proposeSingularLabel('Address')).toBe('Address')
        expect(proposeSingularLabel('Staff')).toBe('Staff')
    })
})

describe('module validation', () => {
    test('accepts labels of 1 to 50 characters', () => {
        expect(validateModuleLabel('Projects')).toBeNull()
        expect(validateModuleLabel('  ')).not.toBeNull()
        expect(validateModuleLabel('x'.repeat(51))).not.toBeNull()
    })

    test('accepts API names of letters, digits and underscores', () => {
        expect(validateModuleApiName('Customer_Orders1')).toBeNull()
        expect(validateModuleApiName('1Orders')).not.toBeNull()
        expect(validateModuleApiName('Customer Orders')).not.toBeNull()
        expect(validateModuleApiName('Customer__Orders')).not.toBeNull()
        expect(validateModuleApiName('Orders_')).not.toBeNull()
    })
})

describe('buildMigrationStub', () => {
    test('writes a create migration that only needs fields', () => {
        expect(buildMigrationStub({ action: 'create', singular_label: 'Project', plural_label: 'Projects' })).toBe(
            [
                "import { defineMigration } from '@zoho-studio/zoho-crm/migrations'",
                '',
                'export default defineMigration({',
                '    create: {',
                "        singular_label: 'Project',",
                "        plural_label: 'Projects',",
                '        fields: (schema) => {',
                "            // schema.text('Code', { length: 50 })",
                '        },',
                '    },',
                '})',
                '',
            ].join('\n')
        )
    })

    test('writes an update migration for the module', () => {
        const stub = buildMigrationStub({ action: 'update', module: 'Deals' })

        expect(stub).toContain("    update: {\n        module: 'Deals',\n        fields: (schema) => {")
        expect(stub).not.toContain('create')
    })

    test('escapes quotes in labels', () => {
        expect(
            buildMigrationStub({ action: 'create', singular_label: "Client's Order", plural_label: "Clients' Orders" })
        ).toContain("plural_label: 'Clients\\' Orders',")
    })
})
