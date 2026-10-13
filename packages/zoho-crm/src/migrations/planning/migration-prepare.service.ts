import { getOrganizationRequest } from '../../entities/organization'
import { describeMigration, validateMigration } from '../definition'
import { readMigrationJournal } from '../journal'
import { loadMigration } from '../loader'

import { checkMigration } from './migration-checks.service'
import { buildMigrationPlan } from './migration-plan.utils'
import type { PreparedMigration } from './migration-plan.types'

/** Loads a migration, validates it, and checks it against Zoho CRM; an invalid one never reaches Zoho. */
export async function prepareMigration(projectPath: string, name: string): Promise<PreparedMigration> {
    const { definition, problem } = await loadMigration(projectPath, name)

    if (!definition) {
        return { name, description: null, plan: null, conflicts: [problem ?? `Migration "${name}" is empty.`] }
    }

    const problems = validateMigration(definition)

    if (problems.length > 0) {
        return { name, description: null, plan: null, conflicts: problems }
    }

    const description = describeMigration(definition)
    const { conflicts, profileIds } = await checkMigration(description)
    const organizationId = (await getOrganizationRequest()).id ?? 'unknown'
    const previousRun = (await readMigrationJournal(projectPath, organizationId))[name]

    if (previousRun?.status === 'applied') {
        conflicts.unshift(`Migration "${name}" was already applied to this organization on ${previousRun.ranAt}.`)
    }

    return { name, description, plan: buildMigrationPlan(description, profileIds), conflicts }
}
