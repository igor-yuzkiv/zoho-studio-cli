import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { basename, dirname } from 'node:path'

import { resolveSourcePath, writeJsonFile } from '@zoho-studio/core'

import {
    delugeReturnTypesByCategory,
    delugeRuntime,
    functionDeployFileSuffix,
    functionsDirName,
    zohoCrmDirName,
    type DelugeFunctionCategory,
} from '../../../zoho-crm.config'
import {
    buildFunctionStub,
    functionDeployFilePath,
    functionSourceCodeFilePath,
    functionSourceDirPath,
} from '../function-source.utils'
import type { FunctionDeployMetadata } from '../function.types'

export interface FunctionScaffold {
    name: string
    api_name: string
    description: string
    category: DelugeFunctionCategory
    returnType: string
}

export interface ScaffoldedFunctionFiles {
    codePath: string
    deployPath: string
}

/** Creates the folder of a new function in `src/`, with a stub that compiles and a deploy file. */
export async function scaffoldFunctionSource(
    projectPath: string,
    scaffold: FunctionScaffold
): Promise<ScaffoldedFunctionFiles> {
    await assertNoPulledFunctionsInSource(projectPath)

    if (await functionSourceExists(projectPath, scaffold.api_name)) {
        const functionPath = resolveSourcePath(projectPath, functionSourceDirPath(scaffold.api_name))
        throw new Error(`Function "${scaffold.api_name}" already exists in "${functionPath}".`)
    }

    const allowedReturnTypes: readonly string[] = delugeReturnTypesByCategory[scaffold.category]

    if (!allowedReturnTypes.includes(scaffold.returnType)) {
        throw new Error(
            `A ${scaffold.category} function cannot have the return type "${scaffold.returnType}"; use ${allowedReturnTypes.join(' or ')}.`
        )
    }

    const codePath = resolveSourcePath(projectPath, functionSourceCodeFilePath(scaffold.api_name))
    const deployPath = resolveSourcePath(projectPath, functionDeployFilePath(scaffold.api_name))
    const metadata: FunctionDeployMetadata = {
        id: null,
        name: scaffold.name,
        api_name: scaffold.api_name,
        description: scaffold.description,
        runtime: delugeRuntime,
        category: scaffold.category,
        deployments: [],
    }

    await mkdir(dirname(codePath), { recursive: true })
    await writeFile(codePath, buildFunctionStub(scaffold))
    await writeJsonFile(deployPath, metadata)

    return { codePath, deployPath }
}

/**
 * Throws when `src/zoho-crm/functions/` still holds snapshots from before they moved to `data/` —
 * a folder holding files but no deploy file is one of those.
 */
export async function assertNoPulledFunctionsInSource(projectPath: string): Promise<void> {
    const functionsPath = resolveSourcePath(projectPath, [zohoCrmDirName, functionsDirName])
    const entries = await readdir(functionsPath, { withFileTypes: true }).catch(() => [])

    for (const folder of entries.filter((entry) => entry.isDirectory())) {
        const files = await readdir(resolveSourcePath(projectPath, [zohoCrmDirName, functionsDirName, folder.name]))

        if (files.length > 0 && !files.some((file) => file.endsWith(`.${functionDeployFileSuffix}`))) {
            throw new Error(
                `"${functionsPath}" still holds pulled functions, which now belong in data/. ` +
                    'Move them with "mv src/zoho-crm data/zoho-crm", then pull again if needed.'
            )
        }
    }
}

/** Zoho compares API names ignoring case, so `Oz_Sa_Ping` is taken once `oz_sa_ping` exists. */
export async function functionSourceExists(projectPath: string, apiName: string): Promise<boolean> {
    const folderName = basename(resolveSourcePath(projectPath, functionSourceDirPath(apiName))).toLowerCase()
    const entries = await readdir(resolveSourcePath(projectPath, [zohoCrmDirName, functionsDirName])).catch(() => [])

    return entries.some((entry) => entry.toLowerCase() === folderName)
}
