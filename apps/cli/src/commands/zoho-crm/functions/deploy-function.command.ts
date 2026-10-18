import { Command } from 'commander'

import { getProjectSettings } from '@zoho-studio/core'
import { deployFunctionSource } from '@zoho-studio/zoho-crm/function'

export const deployFunctionCommand = new Command('z-crm:functions:deploy')
    .description('Create or update a function in Zoho from its source in src/')
    .argument('<api_name>', 'the function folder in src/zoho-crm/functions/')
    .option('--changelog <text>', 'describe the change; without it the changelog template is used')
    .action(async (apiName: string, options: { changelog?: string }) => {
        const { projectPath, settings } = await getProjectSettings()

        const result = await deployFunctionSource(projectPath, apiName, {
            changelog: options.changelog,
            changelogTemplate: settings.zohoCrm.functions.changelogTemplate,
        })

        console.log(`${result.operation === 'create' ? 'Created' : 'Updated'} ${apiName} in Zoho (id ${result.id})`)
        console.log(`Changelog: ${result.changelog}`)
    })
