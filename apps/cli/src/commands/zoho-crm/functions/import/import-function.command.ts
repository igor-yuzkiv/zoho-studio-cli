import { search } from '@inquirer/prompts'
import { Command } from 'commander'
import { relative } from 'node:path'

import { getProjectSettings } from '@zoho-studio/core'
import { importFunctionSource, listImportableFunctions, type ImportableFunction } from '@zoho-studio/zoho-crm/function'

export const importFunctionCommand = new Command('z-crm:functions:import')
    .description('Copy a pulled function from data/ into src/ to work on it')
    .argument('[api_name]', 'the function folder in data/zoho-crm/functions/; without it, pick from a list')
    .action(async (requestedApiName: string | undefined) => {
        const { projectPath } = await getProjectSettings()
        const apiName = requestedApiName ?? (await pickImportableFunction(projectPath))

        if (!apiName) {
            return
        }

        const files = await importFunctionSource(projectPath, apiName)

        console.log(`Created ${relative(projectPath, files.codePath)}`)
        console.log(`Created ${relative(projectPath, files.deployPath)}`)
        for (const warning of files.warnings) {
            console.warn(`Warning: ${warning}`)
        }
    })

/** Without a terminal there is nothing to pick with, so the list is printed for the next run. */
async function pickImportableFunction(projectPath: string): Promise<string | null> {
    const importable = await listImportableFunctions(projectPath)

    if (importable.length === 0) {
        console.log('No pulled functions to import. Run "zoho-studio z-crm:functions:pull" first.')
        return null
    }

    if (!process.stdin.isTTY) {
        console.log('Functions you can import:')
        for (const entry of importable) {
            console.log(`  ${describeFunction(entry)}`)
        }
        console.log('Run the command again with one of the API names.')
        return null
    }

    return search({
        message: 'Function to import',
        source: (term) => {
            const needle = (term ?? '').toLowerCase()

            return importable
                .filter((entry) => describeFunction(entry).toLowerCase().includes(needle))
                .map((entry) => ({ name: describeFunction(entry), value: entry.apiName }))
        },
    })
}

function describeFunction(entry: ImportableFunction): string {
    return entry.name === entry.apiName ? entry.apiName : `${entry.apiName} (${entry.name})`
}
