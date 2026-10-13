import type { ZohoFieldCreate } from '../../entities/field'
import type { ZohoModuleCreate } from '../../entities/module'

import type { MigrationDescription } from '../definition'

export type MigrationStep =
    | { kind: 'create-module'; module: ZohoModuleCreate }
    /** `module` is null when the run learns the API name only once Zoho has created the module. */
    | { kind: 'create-fields'; module: string | null; fields: ZohoFieldCreate[] }

export interface MigrationPlan {
    steps: MigrationStep[]
}

export interface MigrationCheck {
    conflicts: string[]
    /** Ids of the profiles a new module is given, in the order they were named. */
    profileIds: string[]
}

/** Everything known about a migration before it runs; any conflict blocks the run. */
export interface PreparedMigration {
    name: string
    description: MigrationDescription | null
    plan: MigrationPlan | null
    conflicts: string[]
}
