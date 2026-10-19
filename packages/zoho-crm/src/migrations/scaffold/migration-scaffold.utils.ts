import { apiNameSchema } from '../definition/fields/field-type.utils'

import type { MigrationScaffold } from './migration-scaffold.types'

const migrationNumberPattern = /^(\d+)-/
const defaultMigrationNumberWidth = 3
const moduleApiNameSchema = apiNameSchema('Module API name')

/** Turns a module label or API name into the part of a file name: `Customer_Orders` → `customer-orders`. */
export function toMigrationNameSegment(value: string): string {
    return value
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

/**
 * Names a new migration after the last numbered one, so it lands at the end of the list:
 * `003-create-projects` follows `002-…`. The list is sorted as text, so the number keeps the width
 * the project already uses; three digits start a project with none.
 */
export function buildNextMigrationName(existingNames: string[], scaffold: MigrationScaffold): string {
    const numbers = existingNames.flatMap((name) => migrationNumberPattern.exec(name)?.[1] ?? [])
    const nextNumber = Math.max(0, ...numbers.map(Number)) + 1
    const width = numbers.length > 0 ? Math.max(...numbers.map((number) => number.length)) : defaultMigrationNumberWidth
    const subject = scaffold.action === 'create' ? scaffold.plural_label : scaffold.module
    const segment = toMigrationNameSegment(subject) || 'module'

    return `${String(nextNumber).padStart(width, '0')}-${scaffold.action}-${segment}`
}

/** A guess the user confirms or corrects: `Projects` → `Project`. */
export function proposeSingularLabel(pluralLabel: string): string {
    const label = pluralLabel.trim()

    if (/ies$/i.test(label)) {
        return `${label.slice(0, -3)}y`
    }

    return /[^s]s$/i.test(label) ? label.slice(0, -1) : label
}

export function validateModuleLabel(value: string): string | null {
    return value.trim().length >= 1 && value.length <= 50 ? null : 'The label must be 1 to 50 characters.'
}

export function validateModuleApiName(value: string): string | null {
    const parsed = moduleApiNameSchema.safeParse(value)

    return parsed.success ? null : (parsed.error.issues[0]?.message ?? 'The module API name is not valid.')
}

/** The file a migration starts from: the action filled in, the fields left for the user to declare. */
export function buildMigrationStub(scaffold: MigrationScaffold): string {
    const action =
        scaffold.action === 'create'
            ? [
                  '    create: {',
                  `        singular_label: ${quote(scaffold.singular_label)},`,
                  `        plural_label: ${quote(scaffold.plural_label)},`,
              ]
            : ['    update: {', `        module: ${quote(scaffold.module)},`]

    return [
        "import { defineMigration } from '@zoho-studio/zoho-crm/migrations'",
        '',
        'export default defineMigration({',
        ...action,
        '        fields: (schema) => {',
        "            // schema.text('Code', { length: 50 })",
        '        },',
        '    },',
        '})',
        '',
    ].join('\n')
}

function quote(value: string): string {
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}
