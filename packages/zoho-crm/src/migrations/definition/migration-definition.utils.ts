import { declareFields } from './field-schema.builder'
import type { MigrationDefinition, MigrationDescription } from './migration-definition.types'

const defaultProfiles = ['Administrator']

/** Gives a migration file its types; the definition itself is returned unchanged. */
export function defineMigration(definition: MigrationDefinition): MigrationDefinition {
    return definition
}

/** Reduces a migration to the data a run sends. Validate it first: an invalid one is described as is. */
export function describeMigration(definition: MigrationDefinition): MigrationDescription {
    if (definition.create) {
        const { api_name, singular_label, plural_label, profiles, fields } = definition.create

        return {
            action: 'create',
            module: api_name === undefined ? { singular_label, plural_label } : { api_name, singular_label, plural_label },
            profiles: profiles ?? defaultProfiles,
            fields: declareFields(fields),
        }
    }

    return {
        action: 'update',
        module: { api_name: definition.update.module },
        fields: declareFields(definition.update.fields),
    }
}
