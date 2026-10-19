import type { FieldTypeDefinition } from '../fields'
import type { fieldTypes, FieldDataType } from '../migration-definition.schemas'

export type { FieldDataType }

/** The options `schema.<type>()` takes, as documented in that type's folder in fields/. */
export type FieldOptionsByType = {
    [Type in FieldDataType]: (typeof fieldTypes)[Type] extends FieldTypeDefinition<infer Options> ? Options : never
}

/**
 * Declares the fields of a migration, one call per field, in the order they are created. Every
 * method takes the field label, 1 to 25 characters, and the options of its type; the options may be
 * left out when none of them is required.
 */
export type FieldSchema = {
    [Type in keyof typeof fieldTypes]: object extends FieldOptionsByType[Type]
        ? (label: string, options?: FieldOptionsByType[Type]) => void
        : (label: string, options: FieldOptionsByType[Type]) => void
}

export type FieldsDeclaration = (schema: FieldSchema) => void

/** One `schema.<type>(label, options)` call, kept as written so it can be validated before use. */
export interface FieldDeclaration {
    label: string
    dataType: FieldDataType
    options: Record<string, unknown>
}
