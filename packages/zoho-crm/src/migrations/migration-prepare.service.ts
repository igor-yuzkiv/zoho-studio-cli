import { checkMigration } from './migration-checks.service'
import { loadMigration } from './migration.loader'
import { buildMigrationPlan } from './migration-plan.utils'
import type { PreparedMigration } from './migration.types'
import { describeMigration, validateMigration } from './migration.utils'

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

    return { name, description, plan: buildMigrationPlan(description, profileIds), conflicts }
}
