import { apiNameSchema } from '../definition/fields/field-type.utils'

import type { MigrationScaffold } from './migration-scaffold.types'

const moduleApiNameSchema = apiNameSchema('Module API name')

/** Turns a module label or API name into the part of a file name: `Customer Orders` → `customer_orders`. */
export function toMigrationNameSegment(value: string): string {
    return value
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
}

/**
 * Names a migration the way Laravel does, after the moment it is made:
 * `2026_10_19_143005_create_projects`. The prefix has one width, so the list, sorted as text, is
 * in the order the migrations were made, and two people working apart do not pick the same name.
 * Zero-padded numbered names, such as `001-…`, sort ahead of it.
 */
export function buildMigrationName(scaffold: MigrationScaffold, now: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0')
    const date = `${now.getFullYear()}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}`
    const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const subject = scaffold.action === 'create' ? scaffold.plural_label : scaffold.module
    const segment = toMigrationNameSegment(subject) || 'module'

    return `${date}_${time}_${scaffold.action}_${segment}`
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
