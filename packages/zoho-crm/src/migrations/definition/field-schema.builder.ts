import type { ZohoFieldCreate } from '../../entities/field'

import { fieldTypeOf, fieldTypes } from './migration-definition.schemas'
import type { FieldTooltip } from './fields'
import type { FieldDataType, FieldDeclaration, FieldsDeclaration, FieldSchema } from './types'

/** Runs a fields declaration and records every call as written, for validation before any payload. */
export function collectFieldDeclarations(declaration: FieldsDeclaration): FieldDeclaration[] {
    const declarations: FieldDeclaration[] = []
    const schema = Object.fromEntries(
        (Object.keys(fieldTypes) as FieldDataType[]).map((dataType) => [
            dataType,
            (label: string, options: Record<string, unknown> = {}) => declarations.push({ label, dataType, options }),
        ])
    ) as unknown as FieldSchema

    declaration(schema)

    return declarations
}

/** Runs a fields declaration and returns the create payload of every field it declared, in order. */
export function declareFields(declaration: FieldsDeclaration): ZohoFieldCreate[] {
    return collectFieldDeclarations(declaration).map(toFieldPayload)
}

/** Assumes a validated declaration: the options are the ones its type allows. */
export function toFieldPayload({ label, dataType, options }: FieldDeclaration): ZohoFieldCreate {
    const tooltip = options.tooltip as FieldTooltip | undefined

    return withoutUndefined({
        field_label: label,
        api_name: options.api_name as string | undefined,
        data_type: dataType,
        tooltip: tooltip === undefined ? undefined : toZohoTooltip(tooltip),
        ...fieldTypeOf(dataType).toPayload(label, options),
    })
}

function toZohoTooltip(tooltip: FieldTooltip): { name: string; value: string } {
    return typeof tooltip === 'string'
        ? { name: 'info_icon', value: tooltip }
        : { name: tooltip.type, value: tooltip.text }
}

function withoutUndefined<T extends object>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T
}
