import cliProgress from 'cli-progress'
import { Command } from 'commander'

import { globalPicklistsDirName } from '@/config'
import { getGlobalPicklist, getGlobalPicklistsList, type ZohoGlobalPicklist } from '@/entities/global-picklist'
import { getProjectSettings } from '@/settings'
import { describeRequestError } from '@/shared/api/crm'
import { replaceArtifactDir, resolveArtifactFileName, writeArtifactJson } from '@/shared/artifacts'
import { createCommandLogger } from '@/shared/logger'
import { delay } from '@/shared/utils'

const delayBetweenPicklistRequestsMs = 300

type FailedPicklist = {
    apiName: string
    message: string
}

export const pullGlobalPicklistsCommand = new Command('global-picklists:pull')
    .description('Download every Zoho CRM global picklist, with its values, into the project')
    .action(async () => {
        const logger = await createCommandLogger('global-picklists:pull')
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
        await replaceArtifactDir(projectPath, [globalPicklistsDirName])

        const takenFileNames = new Set<string>()
        const failed: FailedPicklist[] = []
        let savedPicklists = 0
        const progressBar = new cliProgress.SingleBar(
            {
                format: 'Pulling global picklists |{bar}| {value}/{total} | {name}',
                hideCursor: true,
                clearOnComplete: false,
            },
            cliProgress.Presets.shades_classic
        )

        progressBar.start(globalPicklists.length, 0, { name: 'Starting...' })

        try {
            for (const [index, globalPicklist] of globalPicklists.entries()) {
                if (index > 0) {
                    await delay(delayBetweenPicklistRequestsMs)
                }

                progressBar.update({ name: globalPicklist.api_name })

                try {
                    // The list carries no picklist values, so the full record is fetched per picklist.
                    const details = await getGlobalPicklist(globalPicklist.id)
                    const fileName = resolveArtifactFileName(globalPicklist.api_name, globalPicklist.id, takenFileNames)

                    await writeArtifactJson(projectPath, [globalPicklistsDirName, fileName], details)

                    takenFileNames.add(fileName)
                    savedPicklists += 1
                } catch (error) {
                    failed.push({ apiName: globalPicklist.api_name, message: describeRequestError(error) })
                    logger.error(
                        { err: error, globalPicklist: globalPicklist.api_name },
                        'Failed to pull a global picklist'
                    )
                }

                progressBar.increment()
            }
        } finally {
            progressBar.stop()
        }

        logger.info(
            { total: globalPicklists.length, saved: savedPicklists, failed: failed.length },
            'Global picklists pull finished'
        )

        console.log(`Global picklists found: ${globalPicklists.length}`)
        console.log(`Global picklists saved: ${savedPicklists}`)
        console.log(`Global picklists failed: ${failed.length}`)

        for (const failure of failed) {
            console.log(`  - ${failure.apiName}: ${failure.message}`)
        }
    })

/** Ordered so that a name collision is always resolved the same way between runs. */
export function sortGlobalPicklists(globalPicklists: ZohoGlobalPicklist[]): ZohoGlobalPicklist[] {
    return [...globalPicklists].sort(
        (left, right) => left.api_name.localeCompare(right.api_name) || left.id.localeCompare(right.id)
    )
}
