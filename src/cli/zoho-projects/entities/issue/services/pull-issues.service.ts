import { getProjectSettings } from '@/settings'
import { describeProjectsRequestError } from '@/shared/api/projects'
import { createCommandLogger } from '@/shared/logger'
import type { PullProgress, PullResult } from '@/shared/pull'
import { parsePeriod } from '@/zoho-projects/period.utils'
import { describeSkipped, type SkippedEntity } from '@/zoho-projects/raw'

import { getIssueCommentsList, getIssuesList } from '../api'
import { isIssueInPeriod, writeIssue } from '../issue.utils'

export type PullIssuesOptions = {
    from?: string
    to?: string
}

export async function pullIssues(options: PullIssuesOptions, progress: PullProgress): Promise<PullResult> {
    const period = parsePeriod(options)
    const logger = await createCommandLogger('z-projects:issues:pull')
    logger.info({ from: options.from ?? null, to: options.to ?? null }, 'Starting issues pull')

    const { projectPath } = await getProjectSettings()
    const allIssues = await getIssuesList()
    const issues = allIssues.filter((issue) => isIssueInPeriod(issue, period))

    logger.info({ issues: allIssues.length, inPeriod: issues.length }, 'Issues found')

    const skipped: SkippedEntity[] = []
    let savedComments = 0

    progress.start(issues.length)

    try {
        for (const issue of issues) {
            progress.update(issue.name)

            try {
                const comments = await getIssueCommentsList(issue.id)
                const segments = await writeIssue(projectPath, issue, comments)

                savedComments += comments.length
                logger.debug({ id: issue.id, comments: comments.length, path: segments.join('/') }, 'Issue saved')
            } catch (error) {
                const message = describeProjectsRequestError(error)

                skipped.push({ id: issue.id, name: issue.name, message })
                logger.error({ message, issue: issue.id }, 'Issue skipped')
            }

            progress.increment()
        }
    } finally {
        progress.stop()
    }

    const savedIssues = issues.length - skipped.length

    logger.info({ issues: issues.length, savedIssues, savedComments, skipped: skipped.length }, 'Issues pull finished')

    return {
        summary: [
            `Issues found: ${allIssues.length}`,
            `Issues in period: ${issues.length}`,
            `Issues saved: ${savedIssues}`,
            `Comments saved: ${savedComments}`,
            ...describeSkipped('Issues', skipped),
        ],
        failedCount: skipped.length,
    }
}
