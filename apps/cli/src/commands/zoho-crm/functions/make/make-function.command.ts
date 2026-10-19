import { Command } from 'commander'
import { relative } from 'node:path'

import { getProjectSettings, resolveSourcePath } from '@zoho-studio/core'
import {
    assertNoPulledFunctionsInSource,
    functionSourceDirPath,
    functionSnapshotExists,
    functionSourceExists,
    importFunctionSource,
    scaffoldFunctionSource,
} from '@zoho-studio/zoho-crm/function'
import { resolveLocalModuleNames } from '@zoho-studio/zoho-crm/module'

import { promptForFunctionMake } from './function-make-prompt.service'

export const makeFunctionCommand = new Command('z-crm:functions:make')
    .description('Scaffold a new Deluge function in src/, or import a pulled one, through a few questions')
    .action(async () => {
        if (!process.stdin.isTTY) {
            throw new Error('z-crm:functions:make asks questions, so it needs an interactive terminal.')
        }

        const { projectPath, settings } = await getProjectSettings()

        await assertNoPulledFunctionsInSource(projectPath)
        const choice = await promptForFunctionMake({
            projectPath,
            naming: settings.zohoCrm.functions.naming,
            localModuleNames: await resolveLocalModuleNames(projectPath).catch(() => []),
            checkApiNameIsFree: async (apiName) =>
                (await functionSourceExists(projectPath, apiName))
                    ? `Function "${apiName}" already exists in ${relative(projectPath, resolveSourcePath(projectPath, functionSourceDirPath(apiName)))}.`
                    : null,
            hasSnapshot: (apiName) => functionSnapshotExists(projectPath, apiName),
        })

        if (!choice) {
            console.log('Nothing created.')
            return
        }

        const files =
            choice.kind === 'import'
                ? await importFunctionSource(projectPath, choice.apiName)
                : { ...(await scaffoldFunctionSource(projectPath, choice.scaffold)), warnings: [] }

        console.log(`Created ${relative(projectPath, files.codePath)}`)
        console.log(`Created ${relative(projectPath, files.deployPath)}`)
        for (const warning of files.warnings) {
            console.warn(`Warning: ${warning}`)
        }
    })
