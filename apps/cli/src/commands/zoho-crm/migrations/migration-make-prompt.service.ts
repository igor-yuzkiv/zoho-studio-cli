import { confirm, input, search, select } from '@inquirer/prompts'
import { relative } from 'node:path'

import {
    planMigrationScaffold,
    proposeSingularLabel,
    validateModuleApiName,
    validateModuleLabel,
    type MigrationScaffold,
    type ScaffoldedMigration,
} from '@zoho-studio/zoho-crm/migrations'

interface MigrationMakeContext {
    projectPath: string
    localModuleNames: string[]
}

export interface MigrationMakeChoice {
    scaffold: MigrationScaffold
    /** The name and file the user confirmed. */
    planned: ScaffoldedMigration
}

/** Walks the user through a new migration and shows what will be created. Answers `null` when they decline. */
export async function promptForMigrationMake(context: MigrationMakeContext): Promise<MigrationMakeChoice | null> {
    const action = await select<MigrationScaffold['action']>({
        message: 'Migration type',
        choices: [
            { name: 'Create a module', value: 'create' },
            { name: 'Add fields to an existing module', value: 'update' },
        ],
    })
    const scaffold: MigrationScaffold =
        action === 'create' ? await promptForNewModule() : { action, module: await promptForExistingModule(context) }
    const planned = await planMigrationScaffold(context.projectPath, scaffold)

    console.log('\nMigration to create:')
    console.log(`  Name:   ${planned.name}`)
    console.log(`  File:   ${relative(context.projectPath, planned.path)}`)
    console.log(
        scaffold.action === 'create'
            ? `  Action: create the module "${scaffold.plural_label}" (singular "${scaffold.singular_label}")`
            : `  Action: add fields to the module "${scaffold.module}"`
    )

    return (await confirm({ message: 'Create the migration?', default: true })) ? { scaffold, planned } : null
}

async function promptForNewModule(): Promise<MigrationScaffold> {
    const pluralLabel = await input({
        message: 'Module name (plural label)',
        validate: (value) => validateModuleLabel(value) ?? true,
    })
    const singularLabel = await input({
        message: 'Singular label',
        default: proposeSingularLabel(pluralLabel),
        validate: (value) => validateModuleLabel(value) ?? true,
    })

    return { action: 'create', plural_label: pluralLabel.trim(), singular_label: singularLabel.trim() }
}

/** Offers the modules pulled into `data/`, and takes any other API name typed in. */
async function promptForExistingModule(context: MigrationMakeContext): Promise<string> {
    if (context.localModuleNames.length === 0) {
        return input({ message: 'Module API name', validate: (value) => validateModuleApiName(value) ?? true })
    }

    return search({
        message: 'Module',
        source: (term) => {
            const typed = (term ?? '').trim()
            const matches = context.localModuleNames
                .filter((moduleName) => moduleName.toLowerCase().includes(typed.toLowerCase()))
                .map((moduleName) => ({ name: moduleName, value: moduleName }))
            const typedIsListed = context.localModuleNames.some((name) => name.toLowerCase() === typed.toLowerCase())

            return typed && !typedIsListed && !validateModuleApiName(typed)
                ? [...matches, { name: `${typed} (not pulled)`, value: typed }]
                : matches
        },
    })
}
