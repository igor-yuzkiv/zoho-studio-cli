import cliProgress from 'cli-progress'
import { Command } from 'commander'

import { getIssueCommentsList, getIssuesList, isIssueInPeriod, writeIssue } from '@/zoho-projects/entities/issue'
import { getProjectSettings } from '@/settings'
import { parsePeriod } from '@/zoho-projects/period.utils'
import { describeProjectsRequestError } from '@/shared/api/projects'
import { reportSkipped, type SkippedEntity } from '@/zoho-projects/raw'
import { createCommandLogger } from '@/shared/logger'

export const pullIssuesCommand = new Command('z-projects:issues:pull')
    .description(
        'Download the issues of the configured Zoho Projects project, with their comments, as raw JSON. ' +
            'Without --from/--to every issue is pulled; with them only the issues last updated in that period (dates as YYYY-MM-DD, inclusive, UTC)'
    )
    .option('--from <YYYY-MM-DD>', 'Only issues last updated on or after this UTC date')
    .option('--to <YYYY-MM-DD>', 'Only issues last updated on or before this UTC date')
    .action(async (options: { from?: string; to?: string }) => {
        const period = parsePeriod(options)
        const logger = await createCommandLogger('z-projects:issues:pull')
        logger.info({ from: options.from ?? null, to: options.to ?? null }, 'Starting issues pull')

        const { projectPath } = await getProjectSettings()
        const allIssues = await getIssuesList()
        const issues = allIssues.filter((issue) => isIssueInPeriod(issue, period))

        logger.info({ issues: allIssues.length, inPeriod: issues.length }, 'Issues found')

        const skipped: SkippedEntity[] = []
        let savedComments = 0
        const progressBar = new cliProgress.SingleBar(
            {
                format: 'Pulling issues |{bar}| {value}/{total} | {name}',
                hideCursor: true,
                clearOnComplete: false,
            },
            cliProgress.Presets.shades_classic
        )

        progressBar.start(issues.length, 0, { name: 'Starting...' })

        try {
            for (const issue of issues) {
                progressBar.update({ name: issue.name })

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

                progressBar.increment()
            }
        } finally {
            progressBar.stop()
        }

        const savedIssues = issues.length - skipped.length

        logger.info({ issues: issues.length, savedIssues, savedComments, skipped: skipped.length }, 'Issues pull finished')
        console.log(`Issues found: ${allIssues.length}`)
        console.log(`Issues in period: ${issues.length}`)
        console.log(`Issues saved: ${savedIssues}`)
        console.log(`Comments saved: ${savedComments}`)
        reportSkipped('Issues', skipped)
    })
