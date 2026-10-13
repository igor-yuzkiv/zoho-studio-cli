import { maxFieldsPerCreateRequest, type ZohoFieldCreate } from '../entities/field'

import type { MigrationDescription, MigrationPlan, MigrationStep } from './migration.types'

/** Turns a described migration into the requests a run sends, in order. */
export function buildMigrationPlan(description: MigrationDescription, profileIds: string[]): MigrationPlan {
    const steps: MigrationStep[] = []

    if (description.action === 'create') {
        steps.push({
            kind: 'create-module',
            module: { ...description.module, profiles: profileIds.map((id) => ({ id })) },
        })
    }

    const moduleApiName = description.module.api_name ?? null

    for (const fields of chunk(description.fields, maxFieldsPerCreateRequest)) {
        steps.push({ kind: 'create-fields', module: moduleApiName, fields })
    }

    return { steps }
}

function chunk(fields: ZohoFieldCreate[], size: number): ZohoFieldCreate[][] {
    const chunks: ZohoFieldCreate[][] = []

    for (let start = 0; start < fields.length; start += size) {
        chunks.push(fields.slice(start, start + size))
    }

    return chunks
}
