import { readFile } from 'node:fs/promises'

import { resolveSourcePath, writeJsonFile } from '@zoho-studio/core'

import { delugeFunctionCategories, delugeRuntime } from '../../../zoho-crm.config'
import { createFunctionRequest } from '../api/create-function.request'
import { FunctionRequestError } from '../api/function-request.error'
import { updateFunctionRequest } from '../api/update-function.request'
import {
    functionDeclarationName,
    functionDeployFilePath,
    functionSourceCodeFilePath,
    functionSourceDirPath,
    hasFunctionDeclaration,
    validateFunctionApiName,
    validateFunctionDescription,
    validateFunctionName,
} from '../function-source.utils'
import type { FunctionDeployment, FunctionDeployMetadata } from '../function.types'
import { assertNoPulledFunctionsInSource } from './scaffold-function.service'

export interface DeployFunctionOptions {
    /** Used as it is; without it the message comes from `changelogTemplate`. */
    changelog?: string
    /** `{date}` is replaced with the deployment date. */
    changelogTemplate: string
    now?: Date
}

export interface FunctionDeploymentResult {
    operation: FunctionDeployment['operation']
    id: string
    changelog: string
}

/**
 * Creates the function in Zoho when its deploy file has no id yet, and updates it otherwise. The
 * deploy file is written only after Zoho accepted the change, so a failed deploy leaves no trace.
 */
export async function deployFunctionSource(
    projectPath: string,
    apiName: string,
    options: DeployFunctionOptions
): Promise<FunctionDeploymentResult> {
    await assertNoPulledFunctionsInSource(projectPath)

    const deployPath = resolveSourcePath(projectPath, functionDeployFilePath(apiName))
    const codePath = resolveSourcePath(projectPath, functionSourceCodeFilePath(apiName))
    const metadata = await readFunctionDeployMetadata(projectPath, apiName, deployPath)
    const code = await readFile(codePath, 'utf8').catch(() => {
        throw new Error(`Function "${apiName}" has no code at "${codePath}".`)
    })

    assertFunctionDeployable(metadata, apiName, code)

    const date = (options.now ?? new Date()).toISOString()
    const changelog = options.changelog ?? options.changelogTemplate.replaceAll('{date}', date)
    const operation: FunctionDeployment['operation'] = metadata.id ? 'update' : 'create'
    const id = await sendFunction(metadata, code, changelog).catch((error: unknown) => {
        throw explainFunctionRejection(error, metadata)
    })

    await writeJsonFile(deployPath, {
        ...metadata,
        id,
        deployments: [...metadata.deployments, { date, operation, changelog }],
    } satisfies FunctionDeployMetadata)

    return { operation, id, changelog }
}

async function sendFunction(metadata: FunctionDeployMetadata, code: string, changelog: string): Promise<string> {
    if (metadata.id) {
        await updateFunctionRequest(metadata.id, metadata, code, changelog)
        return metadata.id
    }

    return (await createFunctionRequest(metadata, code, changelog)).id
}

async function readFunctionDeployMetadata(
    projectPath: string,
    apiName: string,
    deployPath: string
): Promise<FunctionDeployMetadata> {
    const metadata = await Bun.file(deployPath)
        .json()
        .catch(() => null)

    if (!metadata) {
        const functionPath = resolveSourcePath(projectPath, functionSourceDirPath(apiName))
        throw new Error(
            `No function "${apiName}" to deploy: expected "${deployPath}" in "${functionPath}". ` +
                'Create it with "zoho-studio z-crm:functions:make".'
        )
    }

    return metadata as FunctionDeployMetadata
}

function assertFunctionDeployable(metadata: FunctionDeployMetadata, apiName: string, code: string): void {
    const problems = [
        metadata.id === null || typeof metadata.id === 'string'
            ? null
            : 'id must be a string, or null before the first deploy.',
        metadata.api_name === apiName ? null : `api_name is "${metadata.api_name}", but the folder is "${apiName}".`,
        validateFunctionName(String(metadata.name)),
        validateFunctionApiName(String(metadata.api_name)),
        validateFunctionDescription(String(metadata.description ?? '')),
        metadata.runtime === delugeRuntime ? null : `runtime must be "${delugeRuntime}".`,
        delugeFunctionCategories.includes(metadata.category)
            ? null
            : `category must be one of ${delugeFunctionCategories.join(', ')}.`,
        Array.isArray(metadata.deployments) ? null : 'deployments must be a list.',
    ].filter((problem): problem is string => problem !== null)

    if (problems.length > 0) {
        throw new Error(`The deploy file of "${apiName}" is invalid:\n  ${problems.join('\n  ')}`)
    }

    const declarationName = functionDeclarationName(metadata.name, metadata.category)

    if (!hasFunctionDeclaration(code, declarationName)) {
        throw new Error(
            `The code of "${apiName}" must declare "${declarationName}" — Zoho builds the declaration from the category and the display name.`
        )
    }
}

function explainFunctionRejection(error: unknown, metadata: FunctionDeployMetadata): unknown {
    if (!(error instanceof FunctionRequestError)) {
        return error
    }

    if (error.code === 'DUPLICATE_DATA' && !metadata.id) {
        return new Error(
            `Zoho already has a function with the API name "${metadata.api_name}" (${error.message}). ` +
                'Nothing was changed. To work on that function, pull functions and import it with "zoho-studio z-crm:functions:make".',
            { cause: error }
        )
    }

    if (error.code === 'INVALID_DATA' && metadata.id) {
        return new Error(
            `The function with id ${metadata.id} no longer exists in Zoho (${error.message}). ` +
                'Set "id" to null in the deploy file to create it again.',
            { cause: error }
        )
    }

    return error
}
