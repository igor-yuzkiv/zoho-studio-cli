import { describe, expect, test } from 'bun:test'

import {
    buildMigrationName,
    buildMigrationStub,
    proposeSingularLabel,
    toMigrationNameSegment,
    validateModuleApiName,
    validateModuleLabel,
} from '@zoho-studio/zoho-crm/migrations'

describe('toMigrationNameSegment', () => {
    test('turns labels and API names into snake case', () => {
        expect(toMigrationNameSegment('Customer Orders')).toBe('customer_orders')
        expect(toMigrationNameSegment('Customer_Orders')).toBe('customer_orders')
        expect(toMigrationNameSegment('CustomerOrders')).toBe('customer_orders')
        expect(toMigrationNameSegment('  Projects & Tasks! ')).toBe('projects_tasks')
    })
})

describe('buildMigrationName', () => {
    const create = { action: 'create', singular_label: 'Project', plural_label: 'Projects' } as const

    test('starts with the local date and time, as Laravel names its migrations', () => {
        expect(buildMigrationName(create, new Date(2026, 9, 19, 14, 30, 5))).toBe('2026_10_19_143005_create_projects')
        expect(buildMigrationName({ action: 'update', module: 'Customer_Orders' }, new Date(2026, 0, 2, 3, 4, 5))).toBe(
            '2026_01_02_030405_update_customer_orders'
        )
    })

    test('sorts as text in the order the migrations were made, after zero-padded numbered ones', () => {
        const names = [
            '001-create-projects',
            '012-add-budget',
            buildMigrationName(create, new Date(2026, 8, 30, 23, 59, 59)),
            buildMigrationName(create, new Date(2026, 9, 1, 0, 0, 0)),
            buildMigrationName(create, new Date(2026, 9, 1, 10, 0, 0)),
        ]

        expect([...names].sort()).toEqual(names)
    })

    test('falls back to a generic segment when the label has no letters or digits', () => {
        expect(
            buildMigrationName(
                { action: 'create', singular_label: 'Ж', plural_label: 'Жж' },
                new Date(2026, 9, 19, 14, 30, 5)
            )
        ).toBe('2026_10_19_143005_create_module')
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
