import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

import cliProgress from 'cli-progress'
import { Command } from 'commander'

import { getFunctionCode, getFunctionsList, type ZohoFunction } from '@/entities/function'
import { getProjectSettings } from '@/settings'
import { createCommandLogger } from '@/shared/logger'
import { resolveProjectDirPath, writeJsonFile } from '@/shared/utils'

const delayBetweenCodeRequestsMs = 300

type FailedFunction = {
    name: string
    apiName: string
    message: string
}

export const pullFunctionsCommand = new Command('functions:pull')
    .description('Download every Zoho function into the project functions directory')
    .action(async () => {
        const logger = await createCommandLogger('functions:pull')
        logger.info('Starting functions pull')

        const { projectPath, settings } = await getProjectSettings()
        const functionsPath = resolveProjectDirPath(
            projectPath,
            settings.crm.functions.root_dir,
            'crm.functions.root_dir'
        )

        let functions: ZohoFunction[]

        try {
            functions = await getFunctionsList()
        } catch (error) {
            logger.error({ err: error }, 'Failed to fetch the functions list')
            throw error
        }

        logger.info({ total: functions.length }, 'Functions found')

        // The directory mirrors exactly what this pull returned, so stale functions are dropped.
        await rm(functionsPath, { recursive: true, force: true })
        await mkdir(functionsPath, { recursive: true })

        for (const zohoFunction of functions) {
            await writeJsonFile(resolveMetadataPath(functionsPath, zohoFunction), zohoFunction)
        }

        const failed: FailedFunction[] = []
        const progressBar = new cliProgress.SingleBar(
            {
                format: 'Pulling functions |{bar}| {value}/{total} | {name}',
                hideCursor: true,
                clearOnComplete: false,
            },
            cliProgress.Presets.shades_classic
        )

        progressBar.start(functions.length, 0, { name: 'Starting...' })

        try {
            for (const [index, zohoFunction] of functions.entries()) {
                if (index > 0) {
                    await delay(delayBetweenCodeRequestsMs)
                }

                progressBar.update({ name: zohoFunction.name })

                try {
                    const code = await getFunctionCode(zohoFunction.id)
                    await Bun.write(
                        resolveCodePath(functionsPath, zohoFunction, settings.crm.functions.code_extension),
                        code
                    )
                } catch (error) {
                    failed.push({
                        name: zohoFunction.name,
                        apiName: zohoFunction.api_name,
                        message: error instanceof Error ? error.message : String(error),
                    })
                    logger.error(
                        { err: error, functionId: zohoFunction.id, apiName: zohoFunction.api_name },
                        'Failed to fetch function code'
                    )
                }

                progressBar.increment()
            }
        } finally {
            progressBar.stop()
        }

        const downloaded = functions.length - failed.length
        logger.info({ total: functions.length, downloaded, failed: failed.length }, 'Functions pull finished')

        console.log(`Functions found: ${functions.length}`)
        console.log(`Metadata saved: ${functions.length}`)
        console.log(`Code downloaded: ${downloaded}`)
        console.log(`Code failed: ${failed.length}`)

        for (const failure of failed) {
            console.log(`  - ${failure.name} (${failure.apiName}): ${failure.message}`)
        }
    })

function resolveMetadataPath(functionsPath: string, zohoFunction: ZohoFunction): string {
    return join(
        resolveFunctionDirPath(functionsPath, zohoFunction),
        `${toPathSegment(zohoFunction.name)}.metadata.json`
    )
}

function resolveCodePath(functionsPath: string, zohoFunction: ZohoFunction, codeExtension: string): string {
    return join(
        resolveFunctionDirPath(functionsPath, zohoFunction),
        resolveCodeFileName(zohoFunction.name, codeExtension)
    )
}

/** A configured extension may be written with or without its leading dot, or left out entirely. */
export function resolveCodeFileName(functionName: string, codeExtension: string): string {
    const extension = toPathSegment(codeExtension.replace(/^\.+/, ''))

    return extension ? `${toPathSegment(functionName)}.${extension}` : toPathSegment(functionName)
}

function resolveFunctionDirPath(functionsPath: string, zohoFunction: ZohoFunction): string {
    return join(functionsPath, toPathSegment(zohoFunction.api_name))
}

// Zoho names are kept as they are; only characters that cannot appear in a path segment are replaced.
function toPathSegment(value: string): string {
    return value.replace(/[/\\\0]/g, '_')
}

function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
