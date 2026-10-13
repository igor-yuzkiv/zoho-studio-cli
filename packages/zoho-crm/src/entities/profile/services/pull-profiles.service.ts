import { getProjectSettings } from '@zoho-studio/core'
import { describeRequestError } from '../../../api'
import { replaceArtifactDir, resolveArtifactFileName, writeArtifactJson } from '@zoho-studio/core'
import { createCommandLogger } from '@zoho-studio/core'
import type { PullProgress, PullResult } from '@zoho-studio/core'
import { profilesDirName, zohoCrmDirName } from '../../../zoho-crm.config'

import { getProfilesList } from '../api'
import type { ZohoProfile } from '../profile.types'

export async function pullProfiles(progress: PullProgress): Promise<PullResult> {
    const logger = await createCommandLogger('z-crm:profiles:pull')
    logger.info('Starting profiles pull')

    const { projectPath } = await getProjectSettings()

    let profiles: ZohoProfile[]

    try {
        profiles = [...(await getProfilesList())].sort(
            (left, right) => left.api_name.localeCompare(right.api_name) || left.id.localeCompare(right.id)
        )
    } catch (error) {
        logger.error({ err: error }, 'Failed to fetch the profiles list')
        throw new Error(describeRequestError(error), { cause: error })
    }

    logger.info({ total: profiles.length }, 'Profiles found')

    // Rewritten only once the list arrived, so a failed pull keeps the previous snapshot.
    await replaceArtifactDir(projectPath, [zohoCrmDirName, profilesDirName])

    const takenFileNames = new Set<string>()

    progress.start(profiles.length)

    try {
        for (const profile of profiles) {
            progress.update(profile.api_name)

            const fileName = resolveArtifactFileName(profile.api_name, profile.id, takenFileNames)

            await writeArtifactJson(projectPath, [zohoCrmDirName, profilesDirName, fileName], profile)
            takenFileNames.add(fileName)

            progress.increment()
        }
    } finally {
        progress.stop()
    }

    logger.info({ total: profiles.length }, 'Profiles pull finished')

    return {
        summary: [`Profiles saved: ${profiles.length}`],
        failedCount: 0,
    }
}
