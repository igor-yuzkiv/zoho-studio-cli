import { getProjectSettings } from '@zoho-studio/core'
import { describeRequestError } from '../../../api'
import { replaceArtifactDir, resolveArtifactFileName, writeArtifactJson } from '@zoho-studio/core'
import { createCommandLogger } from '@zoho-studio/core'
import type { PullProgress, PullResult } from '@zoho-studio/core'
import { delay } from '@zoho-studio/core'
import { globalPicklistsDirName, zohoCrmDirName } from '../../../zoho-crm.config'

import { getGlobalPicklist, getGlobalPicklistsList } from '../api'
import type { ZohoGlobalPicklist } from '../global-picklist.types'
import { sortGlobalPicklists } from '../global-picklist.utils'

const delayBetweenPicklistRequestsMs = 300

type FailedPicklist = {
    apiName: string
    message: string
}

export async function pullGlobalPicklists(progress: PullProgress): Promise<PullResult> {
    const logger = await createCommandLogger('z-crm:global-picklists:pull')
    logger.info('Starting global picklists pull')

    const { projectPath } = await getProjectSettings()

    let globalPicklists: ZohoGlobalPicklist[]

    try {
        globalPicklists = sortGlobalPicklists(await getGlobalPicklistsList())
    } catch (error) {
        logger.error({ err: error }, 'Failed to fetch the global picklists list')
        throw new Error(describeRequestError(error), { cause: error })
    }

    logger.info({ total: globalPicklists.length }, 'Global picklists found')

    // Rewritten only once the list arrived, so a failed pull keeps the previous snapshot.
    await replaceArtifactDir(projectPath, [zohoCrmDirName, globalPicklistsDirName])

    const takenFileNames = new Set<string>()
    const failed: FailedPicklist[] = []
    let savedPicklists = 0

    progress.start(globalPicklists.length)

    try {
        for (const [index, globalPicklist] of globalPicklists.entries()) {
            if (index > 0) {
                await delay(delayBetweenPicklistRequestsMs)
            }

            progress.update(globalPicklist.api_name)

            try {
                // The list carries no picklist values, so the full record is fetched per picklist.
                const details = await getGlobalPicklist(globalPicklist.id)
                const fileName = resolveArtifactFileName(globalPicklist.api_name, globalPicklist.id, takenFileNames)

                await writeArtifactJson(projectPath, [zohoCrmDirName, globalPicklistsDirName, fileName], details)

                takenFileNames.add(fileName)
                savedPicklists += 1
            } catch (error) {
                failed.push({ apiName: globalPicklist.api_name, message: describeRequestError(error) })
                logger.error(
                    { err: error, globalPicklist: globalPicklist.api_name },
                    'Failed to pull a global picklist'
                )
            }

            progress.increment()
        }
    } finally {
        progress.stop()
    }

    logger.info(
        { total: globalPicklists.length, saved: savedPicklists, failed: failed.length },
        'Global picklists pull finished'
    )

    return {
        summary: [
            `Global picklists found: ${globalPicklists.length}`,
            `Global picklists saved: ${savedPicklists}`,
            `Global picklists failed: ${failed.length}`,
            ...failed.map((failure) => `  - ${failure.apiName}: ${failure.message}`),
        ],
        failedCount: failed.length,
    }
}
