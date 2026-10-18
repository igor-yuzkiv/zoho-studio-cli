import { confirm, input, select } from '@inquirer/prompts'
import { relative } from 'node:path'

import type { ProjectSettings } from '@zoho-studio/core'
import {
    buildFunctionApiName,
    functionDeployFilePath,
    functionSourceCodeFilePath,
    toFunctionNameSegment,
    validateFunctionApiName,
    validateFunctionDescription,
    validateFunctionName,
    type FunctionScaffold,
} from '@zoho-studio/zoho-crm/function'
import { resolveSourcePath } from '@zoho-studio/core'
import {
    delugeFunctionCategories,
    delugeReturnTypesByCategory,
    type DelugeFunctionCategory,
} from '@zoho-studio/zoho-crm'

type FunctionNamingSettings = ProjectSettings['zohoCrm']['functions']['naming']

const enterModuleChoice = Symbol('enter')
const noModuleChoice = Symbol('none')

interface FunctionMakeContext {
    projectPath: string
    naming: FunctionNamingSettings
    localModuleNames: string[]
    /** Answers with what is wrong with the API name, beyond its format, or `null`. */
    checkApiNameIsFree: (apiName: string) => Promise<string | null>
}

/** Walks the user through a new function and answers with it, or `null` when they decline the summary. */
export async function promptForFunctionScaffold(context: FunctionMakeContext): Promise<FunctionScaffold | null> {
    const category = await select<DelugeFunctionCategory>({
        message: 'Category',
        choices: delugeFunctionCategories.map((value) => ({ name: value, value })),
    })
    const returnType = await promptForReturnType(category)
    const proposedApiName = context.naming.enabled ? await promptForProposedApiName(context, category) : undefined

    const apiName = await input({
        message: 'API name',
        default: proposedApiName,
        validate: async (value) => validateFunctionApiName(value) ?? (await context.checkApiNameIsFree(value)) ?? true,
    })
    const name = await input({
        message: 'Display name',
        default: apiName,
        validate: (value) => validateFunctionName(value) ?? true,
    })
    const description = await input({
        message: 'Description',
        validate: (value) => validateFunctionDescription(value) ?? true,
    })

    const scaffold: FunctionScaffold = { name, api_name: apiName, description, category, returnType }

    console.log('\nFiles to create:')
    for (const segments of [functionSourceCodeFilePath(apiName), functionDeployFilePath(apiName)]) {
        console.log(`  ${relative(context.projectPath, resolveSourcePath(context.projectPath, segments))}`)
    }

    return (await confirm({ message: 'Create the function?', default: true })) ? scaffold : null
}

async function promptForReturnType(category: DelugeFunctionCategory): Promise<string> {
    const returnTypes = delugeReturnTypesByCategory[category]

    if (returnTypes.length === 1) {
        return returnTypes[0]
    }

    return select({ message: 'Return type', choices: returnTypes.map((value) => ({ name: value, value })) })
}

async function promptForProposedApiName(
    context: FunctionMakeContext,
    category: DelugeFunctionCategory
): Promise<string> {
    const moduleChoice = await select<string | typeof enterModuleChoice | typeof noModuleChoice>({
        message: 'Module',
        choices: [
            ...context.localModuleNames.map((moduleName) => ({ name: moduleName, value: moduleName })),
            { name: 'Enter a module segment', value: enterModuleChoice },
            { name: 'No module', value: noModuleChoice },
        ],
    })
    const module =
        moduleChoice === enterModuleChoice
            ? await input({
                  message: 'Module segment',
                  validate: (value) => (toFunctionNameSegment(value) ? true : 'Enter a segment.'),
              })
            : moduleChoice === noModuleChoice
              ? undefined
              : moduleChoice

    const what = await input({
        message: 'What the function does',
        validate: (value) => (toFunctionNameSegment(value) ? true : 'Describe it in a few words.'),
    })

    return buildFunctionApiName(context.naming, { category, module, what })
}
