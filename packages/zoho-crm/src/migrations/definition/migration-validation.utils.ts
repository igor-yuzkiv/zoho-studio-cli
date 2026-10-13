import { collectFieldDeclarations } from './field-schema.builder'
import {
    createModuleSchema,
    describeIssues,
    fieldLabelSchema,
    fieldOptionSchemas,
    findFieldRuleProblems,
    updateModuleSchema,
} from './migration-definition.schemas'
import type { FieldDeclaration, FieldsDeclaration, MigrationDefinition } from './migration-definition.types'

/** Returns every problem of a migration that can be found without asking Zoho; an empty list means valid. */
export function validateMigration(definition: MigrationDefinition): string[] {
    const action = definition && 'create' in definition && definition.create ? 'create' : 'update'

    if (!definition || Boolean(definition.create) === Boolean(definition.update)) {
        return ['A migration must declare exactly one action: create or update.']
    }

    const schema = action === 'create' ? createModuleSchema : updateModuleSchema
    const parsed = schema.safeParse(definition[action])

    if (!parsed.success) {
        return describeIssues(parsed.error.issues, { unknownOption: `${action}: ` })
    }

    let declarations: FieldDeclaration[]

    try {
        declarations = collectFieldDeclarations(parsed.data.fields as FieldsDeclaration)
    } catch (error) {
        return [`The fields declaration failed: ${error instanceof Error ? error.message : String(error)}`]
    }

    if (action === 'update' && declarations.length === 0) {
        return ['An update must add at least one field.']
    }

    return validateFields(declarations)
}

function validateFields(declarations: FieldDeclaration[]): string[] {
    const problems: string[] = []
    const seenLabels = new Set<string>()
    const seenApiNames = new Set<string>()

    for (const { label, dataType, options } of declarations) {
        const subject = `Field "${label}": `
        const report = (problem: string) => problems.push(`${subject}${problem}`)
        const parsedLabel = fieldLabelSchema.safeParse(label)
        const parsedOptions = fieldOptionSchemas[dataType].safeParse(options)

        if (!parsedLabel.success) {
            problems.push(...describeIssues(parsedLabel.error.issues, { all: subject, unknownOption: subject }))
        } else if (seenLabels.has(label.toLowerCase())) {
            report('the label is declared more than once.')
        }

        if (typeof label === 'string') {
            seenLabels.add(label.toLowerCase())
        }

        if (!parsedOptions.success) {
            problems.push(...describeIssues(parsedOptions.error.issues, { all: subject, unknownOption: subject }))
            continue
        }

        const apiName = parsedOptions.data.api_name

        if (apiName !== undefined) {
            if (seenApiNames.has(apiName.toLowerCase())) {
                report(`API name "${apiName}" is declared more than once.`)
            }

            seenApiNames.add(apiName.toLowerCase())
        }

        findFieldRuleProblems(dataType, parsedOptions.data).forEach(report)
    }

    return problems
}
