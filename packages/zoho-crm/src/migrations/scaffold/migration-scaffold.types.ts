export type MigrationScaffold =
    { action: 'create'; singular_label: string; plural_label: string } | { action: 'update'; module: string }

export interface ScaffoldedMigration {
    name: string
    path: string
}
