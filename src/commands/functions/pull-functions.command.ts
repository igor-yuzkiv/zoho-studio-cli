import cliProgress from 'cli-progress'
import { Command } from 'commander'

import { functionsDirName } from '@/config'
import {
    getFunctionCode,
    getFunctionsList,
    resolveCodeSegments,
    resolveMetadataSegments,
    type ZohoFunction,
} from '@/entities/function'
import { getProjectSettings } from '@/settings'
import { replaceArtifactDir, writeArtifactJson, writeArtifactText } from '@/shared/artifacts'
import { createCommandLogger } from '@/shared/logger'
import { delay } from '@/shared/utils'

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

        const { projectPath } = await getProjectSettings()

        let functions: ZohoFunction[]

        try {
            functions = await getFunctionsList()
        } catch (error) {
            logger.error({ err: error }, 'Failed to fetch the functions list')
            throw error
        }

        logger.info({ total: functions.length }, 'Functions found')

        // The directory mirrors exactly what this pull returned, so stale functions are dropped.
        await replaceArtifactDir(projectPath, [functionsDirName])

        for (const zohoFunction of functions) {
            await writeArtifactJson(projectPath, resolveMetadataSegments(zohoFunction), zohoFunction)
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
                    await writeArtifactText(projectPath, resolveCodeSegments(zohoFunction), code)
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

