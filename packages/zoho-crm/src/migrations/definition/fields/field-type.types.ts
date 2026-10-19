import type { z } from 'zod'

/**
 * A hint for whoever fills the field in.
 *
 * - A text alone, up to 255 characters, shows as an info icon next to the field — the same as
 *   `{ type: 'info_icon', text }`.
 * - `{ type: 'static_text', text }`, up to 35 characters, shows inside the empty field, on the
 *   field types that allow it.
 */
export type FieldTooltip = string | { type: 'static_text' | 'info_icon'; text: string }

/** The options every field type takes. */
export interface BaseFieldOptions {
    /**
     * Starts with a letter and holds letters, digits and single underscores, not ending with one.
     * Zoho derives one from the label when left out.
     */
    api_name?: string
    tooltip?: FieldTooltip
}

/** Everything a migration needs to know about one field type; a new type is one more of these. */
export interface FieldTypeDefinition<Options extends BaseFieldOptions> {
    /** Checks the options a migration passes; a strict object, so a misspelt option is reported. */
    optionsSchema: z.ZodType<Options>
    /** Whether Zoho accepts a `static_text` tooltip on this type — see zoho-findings/fields.md. */
    staticTextTooltip: boolean
    /** The type's own part of the create payload; label, API name, type and tooltip are common to all. */
    toPayload(label: string, options: Options): Record<string, unknown>
    /** Rules that compare values, run once the options passed the schema. */
    findProblems?(options: Options): string[]
}
