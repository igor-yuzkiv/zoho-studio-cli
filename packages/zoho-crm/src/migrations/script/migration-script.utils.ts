import type { ZohoFieldCreate } from '../../entities/field'
import type { MigrationEvent } from '../running'
import type { MigrationStep, PreparedMigration } from '../planning'

/** The plan and conflicts of a prepared migration, line by line, as the script prints them. */
export function formatPreparedMigration(prepared: PreparedMigration): string[] {
    const lines = [`Migration "${prepared.name}"`]
    const { description, plan } = prepared

    if (description?.action === 'create') {
        const { api_name, singular_label, plural_label } = description.module
        lines.push(
            `  Creates module ${api_name ?? '(API name from Zoho)'} — ${singular_label} / ${plural_label}`,
            `  Profiles: ${description.profiles.join(', ')}`
        )
    } else if (description) {
        lines.push(`  Adds fields to module ${description.module.api_name}`)
    }

    for (const [index, step] of (plan?.steps ?? []).entries()) {
        lines.push(`  ${index + 1}. ${describeStep(step)}`)

        if (step.kind === 'create-fields') {
            lines.push(...step.fields.map((field) => `       ${describeField(field)}`))
        }
    }

    if (prepared.conflicts.length > 0) {
        lines.push('Conflicts:', ...prepared.conflicts.map((conflict) => `  - ${conflict}`))
    }

    return lines
}

/** One event of a run as printed lines; most events are a single line. */
export function formatMigrationEvent(event: MigrationEvent, totalSteps: number): string[] {
    switch (event.type) {
        case 'step-started':
            return [`Step ${event.index + 1}/${totalSteps}: ${describeStep(event.step)}`]
        case 'module-created':
            return [`  module created: ${event.api_name} (id ${event.id})`]
        case 'field-result':
            return event.result.status === 'success'
                ? [`  ✓ ${event.field_label}`]
                : [`  ✗ ${event.field_label}: ${event.result.message} (${event.result.code})`]
        case 'step-finished':
            return event.status === 'failed' ? [`  step failed: ${event.error}`] : []
        case 'verified': {
            const { module, created, missing } = event.verification
            return [
                `Verified in Zoho CRM: module ${module}, ${created.length} fields created, ${missing.length} missing`,
                ...missing.map((label) => `  missing: ${label}`),
            ]
        }
        case 'artifacts-updated':
            return [`Local artifacts updated for module ${event.module}`]
        case 'finished':
            return [event.message]
    }
}

function describeStep(step: MigrationStep): string {
    return step.kind === 'create-module'
        ? `create module ${step.module.api_name ?? step.module.plural_label}`
        : `create ${step.fields.length} field${step.fields.length === 1 ? '' : 's'} in ${step.module ?? 'the new module'}`
}

function describeField(field: ZohoFieldCreate): string {
    const apiName = field.api_name ? ` (${field.api_name})` : ''
    return `${field.data_type.padEnd(19)} ${field.field_label}${apiName}`
}
