import type { MigrationDefinition } from '../definition'

export interface LoadedMigration {
    definition: MigrationDefinition | null
    problem: string | null
}
