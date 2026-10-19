import { confirm } from '@inquirer/prompts'
import { Command } from 'commander'

import { getProjectSettings } from '@zoho-studio/core'
import { deployFunctionSource, type FunctionDeploymentPlan } from '@zoho-studio/zoho-crm/function'

export const deployFunctionCommand = new Command('z-crm:functions:deploy')
    .description('Create or update a function in Zoho from its source in src/')
    .argument('<api_name>', 'the function folder in src/zoho-crm/functions/')
    .option('--changelog <text>', 'describe the change; without it the changelog template is used')
    .option('-y, --yes', 'deploy without asking for confirmation', false)
    .action(async (apiName: string, options: { changelog?: string; yes: boolean }) => {
        if (!options.yes && !process.stdin.isTTY) {
            throw new Error('z-crm:functions:deploy asks for confirmation; pass --yes to deploy without a terminal.')
        }

        const { projectPath, settings } = await getProjectSettings()

        const result = await deployFunctionSource(projectPath, apiName, {
            changelog: options.changelog,
            changelogTemplate: settings.zohoCrm.functions.changelogTemplate,
            confirm: options.yes ? undefined : confirmDeployment,
        })

        if (!result) {
            console.log('Nothing deployed.')
            return
        }

        console.log(`${result.operation === 'create' ? 'Created' : 'Updated'} ${apiName} in Zoho (id ${result.id})`)
    })

async function confirmDeployment(plan: FunctionDeploymentPlan): Promise<boolean> {
    console.log(
        plan.id
            ? `Update the function ${plan.apiName} (id ${plan.id}) in Zoho`
            : `Create a new function ${plan.apiName} in Zoho`
    )
    console.log(`Changelog: ${plan.changelog}`)

    return confirm({ message: 'Deploy?', default: true })
}
