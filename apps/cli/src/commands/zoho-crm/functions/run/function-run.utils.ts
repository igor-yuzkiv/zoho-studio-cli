import type { FunctionParameter, FunctionRunOrigin } from '@zoho-studio/zoho-crm/function'

const shellSafePattern = /^[\w@%+=:,./-]+$/

/** Commander calls it once per `--arg name=value`, folding them into one map. */
export function collectFunctionArgument(value: string, previous: Record<string, string> = {}): Record<string, string> {
    const separator = value.indexOf('=')

    if (separator <= 0) {
        throw new Error(`--arg takes name=value, got "${value}".`)
    }

    return { ...previous, [value.slice(0, separator)]: value.slice(separator + 1) }
}

/** Names that the declaration does not have; Zoho would get an argument the function never reads. */
export function findUnknownArguments(parameters: FunctionParameter[], args: Record<string, string>): string[] {
    const declared = new Set(parameters.map((parameter) => parameter.name))

    return Object.keys(args).filter((name) => !declared.has(name))
}

/** The command that runs the function again with the same arguments, ready to paste into a shell. */
export function buildFunctionRunCommandLine(
    apiName: string,
    origin: FunctionRunOrigin,
    args: Record<string, string>
): string {
    const argumentOptions = Object.entries(args).map(([name, value]) => `--arg ${quoteForShell(`${name}=${value}`)}`)

    return ['zoho-studio z-crm:functions:run', quoteForShell(apiName), `--from ${origin}`, ...argumentOptions].join(' ')
}

function quoteForShell(value: string): string {
    return shellSafePattern.test(value) ? value : `'${value.replaceAll("'", `'\\''`)}'`
}
