import { getProjectSettings } from '@zoho-studio/core'
import { replaceArtifactDir, writeArtifactJson, writeArtifactText } from '@zoho-studio/core'
import { createCommandLogger } from '@zoho-studio/core'
import type { PullProgress, PullResult } from '@zoho-studio/core'
import { delay } from '@zoho-studio/core'
import { functionsDirName, zohoCrmDirName } from '../../../zoho-crm.config'

import { getFunctionCode, getFunctionsList } from '../api'
import type { ZohoFunction } from '../function.types'
import { resolveCodeSegments, resolveMetadataSegments } from '../function.utils'

const delayBetweenCodeRequestsMs = 300

type FailedFunction = {
    name: string
    apiName: string
    message: string
}

export async function pullFunctions(progress: PullProgress): Promise<PullResult> {
    const logger = await createCommandLogger('z-crm:functions:pull')
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
    await replaceArtifactDir(projectPath, [zohoCrmDirName, functionsDirName])

    for (const zohoFunction of functions) {
        await writeArtifactJson(projectPath, resolveMetadataSegments(zohoFunction), zohoFunction)
    }

    const failed: FailedFunction[] = []

    progress.start(functions.length)

    try {
        for (const [index, zohoFunction] of functions.entries()) {
            if (index > 0) {
                await delay(delayBetweenCodeRequestsMs)
            }

            progress.update(zohoFunction.name)

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

            progress.increment()
        }
    } finally {
        progress.stop()
    }

    const downloaded = functions.length - failed.length
    logger.info({ total: functions.length, downloaded, failed: failed.length }, 'Functions pull finished')

    return {
        summary: [
            `Functions found: ${functions.length}`,
            `Metadata saved: ${functions.length}`,
            `Code downloaded: ${downloaded}`,
            `Code failed: ${failed.length}`,
            ...failed.map((failure) => `  - ${failure.name} (${failure.apiName}): ${failure.message}`),
        ],
        failedCount: failed.length,
    }
}
