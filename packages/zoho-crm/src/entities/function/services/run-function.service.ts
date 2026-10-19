import { readdir, readFile } from 'node:fs/promises'

import { resolveSourcePath } from '@zoho-studio/core'

import { functionDeployFileSuffix, functionsDirName, zohoCrmDirName } from '../../../zoho-crm.config'
import { functionSourceCodeFilePath, parseFunctionParameters } from '../function-source.utils'
import type { FunctionParameter } from '../function.types'
import { listFunctionSnapshots, readFunctionSnapshot } from './import-function.service'

/** Where a run takes the code from: the local source, or the snapshot of the last pull. */
export const functionRunOrigins = ['src', 'data'] as const
export type FunctionRunOrigin = (typeof functionRunOrigins)[number]

export interface FunctionRunSource {
    apiName: string
    origin: FunctionRunOrigin
    code: string
    parameters: FunctionParameter[]
}

/** The functions a run can take from that place, sorted by API name. */
export async function listRunnableFunctions(projectPath: string, origin: FunctionRunOrigin): Promise<string[]> {
    return origin === 'src' ? listSourceFunctions(projectPath) : listFunctionSnapshots(projectPath)
}

/** The functions developed in `src/` — folders with a deploy file — sorted by API name. */
export async function listSourceFunctions(projectPath: string): Promise<string[]> {
    const functionsPath = resolveSourcePath(projectPath, [zohoCrmDirName, functionsDirName])
    const entries = await readdir(functionsPath, { withFileTypes: true }).catch(() => [])
    const apiNames: string[] = []

    for (const entry of entries.filter((candidate) => candidate.isDirectory())) {
        const files = await readdir(resolveSourcePath(projectPath, [zohoCrmDirName, functionsDirName, entry.name]))

        if (files.includes(`${entry.name}.${functionDeployFileSuffix}`)) {
            apiNames.push(entry.name)
        }
    }

    return apiNames.sort((left, right) => left.localeCompare(right))
}

/** Reads the code a run sends, and the arguments its declaration asks for. */
export async function readFunctionRunSource(
    projectPath: string,
    apiName: string,
    origin: FunctionRunOrigin
): Promise<FunctionRunSource> {
    const code =
        origin === 'src'
            ? await readSourceCode(projectPath, apiName)
            : (await readFunctionSnapshot(projectPath, apiName)).code

    return { apiName, origin, code, parameters: parseFunctionParameters(code) }
}

async function readSourceCode(projectPath: string, apiName: string): Promise<string> {
    const codePath = resolveSourcePath(projectPath, functionSourceCodeFilePath(apiName))

    return readFile(codePath, 'utf8').catch(() => {
        throw new Error(
            `Function "${apiName}" has no code at "${codePath}". Create it with "zoho-studio z-crm:functions:make" or import it with "zoho-studio z-crm:functions:import".`
        )
    })
}
