import { confirm, input, search, select } from '@inquirer/prompts'
import { Command, Option } from 'commander'

import { getProjectSettings } from '@zoho-studio/core'
import {
    functionRunOrigins,
    listRunnableFunctions,
    readFunctionRunSource,
    runFunctionRequest,
    type FunctionParameter,
    type FunctionRunOrigin,
} from '@zoho-studio/zoho-crm/function'

import { buildFunctionRunCommandLine, collectFunctionArgument, findUnknownArguments } from './function-run.utils'

interface RunFunctionOptions {
    from?: FunctionRunOrigin
    arg?: Record<string, string>
    dryRun: boolean
    force: boolean
}

export const runFunctionCommand = new Command('z-crm:functions:run')
    .description("Run a function's code from src/ or data/ in Zoho, without deploying it, and print the result")
    .argument('[api_name]', 'the function folder in src/ or data/ zoho-crm/functions/; without it, pick from a list')
    .addOption(
        new Option('--from <place>', 'take the code from src/ (local source) or data/ (the last pull)').choices(
            functionRunOrigins
        )
    )
    .option('-a, --arg <name=value>', 'an argument of the function; repeat for each one', collectFunctionArgument)
    .option('--dry-run', 'print the command that runs the function with these arguments, and send nothing', false)
    .option('-f, --force', 'run without asking for confirmation', false)
    .action(async (requestedApiName: string | undefined, options: RunFunctionOptions) => {
        const interactive = Boolean(process.stdin.isTTY)
        const { projectPath } = await getProjectSettings()
        const origin = options.from ?? (await pickRunOrigin(interactive))
        const apiName = requestedApiName ?? (await pickRunnableFunction(projectPath, origin, interactive))
        const source = await readFunctionRunSource(projectPath, apiName, origin)
        const givenArgs = options.arg ?? {}
        const unknown = findUnknownArguments(source.parameters, givenArgs)

        if (unknown.length > 0) {
            const declared = source.parameters.map((parameter) => parameter.name).join(', ') || 'none'
            throw new Error(`${apiName} has no argument ${unknown.join(', ')}; it declares: ${declared}.`)
        }

        const args = await completeArguments(source.parameters, givenArgs, interactive)

        if (options.dryRun) {
            console.log(buildFunctionRunCommandLine(apiName, origin, args))
            return
        }

        if (!options.force && !(await confirmRun(apiName, origin, interactive))) {
            console.log('Nothing run.')
            return
        }

        const result = await runFunctionRequest(apiName, source.code, args)

        console.log(JSON.stringify(result, null, 4))

        if (result.functions?.[0]?.status !== 'success') {
            process.exitCode = 1
        }
    })

/** Nothing is assumed: the code in src/ and the one Zoho had at the last pull can differ. */
async function pickRunOrigin(interactive: boolean): Promise<FunctionRunOrigin> {
    if (!interactive) {
        throw new Error('Pass --from src or --from data: where to take the code from.')
    }

    return select<FunctionRunOrigin>({
        message: 'Take the code from',
        choices: [
            { name: 'src/ — the local source', value: 'src' },
            { name: 'data/ — the snapshot of the last pull', value: 'data' },
        ],
    })
}

async function pickRunnableFunction(
    projectPath: string,
    origin: FunctionRunOrigin,
    interactive: boolean
): Promise<string> {
    const apiNames = await listRunnableFunctions(projectPath, origin)

    if (apiNames.length === 0) {
        throw new Error(
            origin === 'src'
                ? 'No functions in src/zoho-crm/functions/. Create one with "zoho-studio z-crm:functions:make" or import one with "zoho-studio z-crm:functions:import".'
                : 'No functions in data/zoho-crm/functions/. Run "zoho-studio z-crm:functions:pull" first.'
        )
    }

    if (!interactive) {
        throw new Error(`Pass the API name of the function to run: ${apiNames.join(', ')}.`)
    }

    return search({
        message: 'Function to run',
        source: (term) =>
            apiNames
                .filter((apiName) => apiName.toLowerCase().includes((term ?? '').toLowerCase()))
                .map((apiName) => ({ name: apiName, value: apiName })),
    })
}

/** Asks for each declared argument not passed with --arg, in the order the declaration lists them. */
async function completeArguments(
    parameters: FunctionParameter[],
    given: Record<string, string>,
    interactive: boolean
): Promise<Record<string, string>> {
    const missing = parameters.filter((parameter) => !(parameter.name in given))

    if (missing.length > 0 && !interactive) {
        throw new Error(`Pass every argument with --arg: ${missing.map((parameter) => parameter.name).join(', ')}.`)
    }

    const args: Record<string, string> = {}

    for (const parameter of parameters) {
        args[parameter.name] =
            given[parameter.name] ?? (await input({ message: `${parameter.name} (${parameter.type})` }))
    }

    return args
}

async function confirmRun(apiName: string, origin: FunctionRunOrigin, interactive: boolean): Promise<boolean> {
    if (!interactive) {
        throw new Error('z-crm:functions:run asks for confirmation; pass --force to run without a terminal.')
    }

    console.log(`${apiName} will run in Zoho CRM with the code from ${origin}/.`)
    console.log('Whatever it does happens for real: records it changes, emails it sends, webhooks it calls.')

    return confirm({ message: 'Run the function?', default: false })
}
