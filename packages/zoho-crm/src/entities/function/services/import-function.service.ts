import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { resolveArtifactPath, resolveSourcePath, toPathSegment, writeJsonFile } from '@zoho-studio/core'

import {
    delugeFunctionCategories,
    delugeRuntime,
    functionsDirName,
    zohoCrmDirName,
    type DelugeFunctionCategory,
} from '../../../zoho-crm.config'
import {
    functionDeclarationName,
    functionDeployFilePath,
    functionSourceCodeFilePath,
    functionSourceDirPath,
    hasFunctionDeclaration,
} from '../function-source.utils'
import { functionCodeFilePath } from '../function.utils'
import type { FunctionDeployMetadata, ZohoFunction } from '../function.types'
import { assertNoPulledFunctionsInSource, functionSourceExists } from './scaffold-function.service'

export interface ImportedFunctionFiles {
    codePath: string
    deployPath: string
    /** Problems a deploy would run into, worth telling the user about now. */
    warnings: string[]
}

export async function functionSnapshotExists(projectPath: string, apiName: string): Promise<boolean> {
    return (await listSnapshotMetadataFiles(projectPath, apiName)).length > 0
}

export interface ImportableFunction {
    apiName: string
    name: string
}

/** The pulled functions in `data/` that have no source in `src/` yet, sorted by API name. */
export async function listImportableFunctions(projectPath: string): Promise<ImportableFunction[]> {
    const functionsPath = resolveArtifactPath(projectPath, [zohoCrmDirName, functionsDirName])
    const entries = await readdir(functionsPath, { withFileTypes: true }).catch(() => [])
    const importable: ImportableFunction[] = []

    for (const entry of entries.filter((candidate) => candidate.isDirectory())) {
        const [metadataFile] = await listSnapshotMetadataFiles(projectPath, entry.name)

        if (!metadataFile || (await functionSourceExists(projectPath, entry.name))) {
            continue
        }

        const zohoFunction = (await Bun.file(
            resolveArtifactPath(projectPath, [...functionSnapshotDirPath(entry.name), metadataFile])
        ).json()) as ZohoFunction
        importable.push({ apiName: entry.name, name: zohoFunction.name })
    }

    return importable.sort((left, right) => left.apiName.localeCompare(right.apiName))
}

/** Copies a pulled function from `data/` into `src/`, keeping its CRM id so a deploy updates it. */
export async function importFunctionSource(projectPath: string, apiName: string): Promise<ImportedFunctionFiles> {
    await assertNoPulledFunctionsInSource(projectPath)

    if (await functionSourceExists(projectPath, apiName)) {
        const functionPath = resolveSourcePath(projectPath, functionSourceDirPath(apiName))
        throw new Error(`Function "${apiName}" already exists in "${functionPath}".`)
    }

    const { zohoFunction, code } = await readFunctionSnapshot(projectPath, apiName)
    const category = assertDelugeFunction(zohoFunction)

    const codePath = resolveSourcePath(projectPath, functionSourceCodeFilePath(apiName))
    const deployPath = resolveSourcePath(projectPath, functionDeployFilePath(apiName))
    const metadata: FunctionDeployMetadata = {
        id: zohoFunction.id,
        name: zohoFunction.name,
        api_name: zohoFunction.api_name,
        description: typeof zohoFunction.description === 'string' ? zohoFunction.description : '',
        runtime: delugeRuntime,
        category,
        deployments: [],
    }

    await mkdir(dirname(codePath), { recursive: true })
    await writeFile(codePath, code)
    await writeJsonFile(deployPath, metadata)

    const declarationName = functionDeclarationName(metadata.name, category)
    const warnings = hasFunctionDeclaration(code, declarationName)
        ? []
        : [
              `The code does not declare "${declarationName}", so Zoho will reject it on deploy until the declaration is fixed.`,
          ]

    return { codePath, deployPath, warnings }
}

/** The functions pulled into `data/` — folders with a function record — sorted by API name. */
export async function listFunctionSnapshots(projectPath: string): Promise<string[]> {
    const functionsPath = resolveArtifactPath(projectPath, [zohoCrmDirName, functionsDirName])
    const entries = await readdir(functionsPath, { withFileTypes: true }).catch(() => [])
    const apiNames: string[] = []

    for (const entry of entries.filter((candidate) => candidate.isDirectory())) {
        if (await functionSnapshotExists(projectPath, entry.name)) {
            apiNames.push(entry.name)
        }
    }

    return apiNames.sort((left, right) => left.localeCompare(right))
}

/** A pulled function's record and code, as they were in Zoho at the last pull. */
export async function readFunctionSnapshot(
    projectPath: string,
    apiName: string
): Promise<{ zohoFunction: ZohoFunction; code: string }> {
    const zohoFunction = await readFunctionSnapshotMetadata(projectPath, apiName)
    const snapshotCodePath = resolveArtifactPath(projectPath, functionCodeFilePath(zohoFunction))
    const code = await readFile(snapshotCodePath, 'utf8').catch(() => {
        throw new Error(`The snapshot of "${apiName}" has no code at "${snapshotCodePath}". Pull functions again.`)
    })

    return { zohoFunction, code }
}

function functionSnapshotDirPath(apiName: string): string[] {
    return [zohoCrmDirName, functionsDirName, toPathSegment(apiName)]
}

async function listSnapshotMetadataFiles(projectPath: string, apiName: string): Promise<string[]> {
    const files = await readdir(resolveArtifactPath(projectPath, functionSnapshotDirPath(apiName))).catch(() => [])

    return files.filter((file) => file.endsWith('.metadata.json'))
}

async function readFunctionSnapshotMetadata(projectPath: string, apiName: string): Promise<ZohoFunction> {
    const snapshotPath = resolveArtifactPath(projectPath, functionSnapshotDirPath(apiName))
    const [metadataFile, ...otherMetadataFiles] = await listSnapshotMetadataFiles(projectPath, apiName)

    if (!metadataFile) {
        throw new Error(
            `No pulled function "${apiName}" in "${snapshotPath}". Run "zoho-studio z-crm:functions:pull" first.`
        )
    }

    if (otherMetadataFiles.length > 0) {
        throw new Error(`"${snapshotPath}" holds more than one function record. Pull functions again.`)
    }

    return Bun.file(
        resolveArtifactPath(projectPath, [...functionSnapshotDirPath(apiName), metadataFile])
    ).json() as Promise<ZohoFunction>
}

function assertDelugeFunction(zohoFunction: ZohoFunction): DelugeFunctionCategory {
    if (zohoFunction.runtime !== delugeRuntime) {
        throw new Error(
            `"${zohoFunction.api_name}" runs on ${String(zohoFunction.runtime ?? 'an unknown runtime')}; only ${delugeRuntime} functions can be imported.`
        )
    }

    const category = delugeFunctionCategories.find((value) => value === zohoFunction.category)

    if (!category) {
        throw new Error(
            `"${zohoFunction.api_name}" has the category "${String(zohoFunction.category ?? 'none')}", which is not one of ${delugeFunctionCategories.join(', ')}.`
        )
    }

    return category
}
