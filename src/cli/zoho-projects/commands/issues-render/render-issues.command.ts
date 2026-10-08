import { Command } from 'commander'

import { loadRawIssues, renderIssue, renderIssuesIndex } from '@/zoho-projects/entities/issue'
import type { IndexRenderContext } from '@/zoho-projects/entities/milestone'
import { loadRawTree } from '@/zoho-projects/entities/task'
import { removeFileFromOtherStatuses, resolveMdPath, writeMdFile } from '@/zoho-projects/md'
import { reportSkipped } from '@/zoho-projects/raw'
import { getProjectSettings } from '@/settings'
import { assertProjectsConfigured } from '@/shared/api/projects'
import { createCommandLogger } from '@/shared/logger'

export const renderIssuesCommand = new Command('z-projects:issues:render')
    .description(
        'Build the Obsidian markdown catalogue of issues from the raw Zoho Projects JSON, in md/issues/ under src/zoho-projects/md/ or the folder projects.mdPath names'
    )
    .action(async () => {
        const logger = await createCommandLogger('z-projects:issues:render')
        logger.info('Starting issues render')

        const { projectPath, settings } = await getProjectSettings()

        assertProjectsConfigured(settings.projects)

        const mdPath = resolveMdPath(projectPath, settings.projects.mdPath)
        const raw = await loadRawIssues(projectPath)

        if (raw.issues.length === 0 && raw.skippedFiles.length === 0) {
            console.log('Nothing to render: src/zoho-projects/raw/issues/ is empty. Run z-projects:issues:pull first.')
            return
        }

        // Tasks are read only so an issue can link the tasks it mentions.
        const tree = await loadRawTree(projectPath)
        const context: IndexRenderContext = {
            projects: settings.projects,
            projectName: raw.projectName ?? tree.projectName,
            renderedAt: new Date().toISOString().slice(0, 10),
        }
        const index = renderIssuesIndex(raw.issues, context)
        let comments = 0

        await writeMdFile(mdPath, index.segments, index.content)

        for (const issue of raw.issues) {
            const rendered = renderIssue(issue, {
                projects: settings.projects,
                issuesById: raw.issuesById,
                tasksById: tree.tasksById,
            })

            await removeFileFromOtherStatuses(mdPath, rendered.segments)
            await writeMdFile(mdPath, rendered.segments, rendered.content)
            comments += issue.comments.length
        }

        const summary = { issues: raw.issues.length, comments, skippedFiles: raw.skippedFiles.length }

        logger.info(summary, 'Issues render finished')
        console.log(`Catalogue written to: ${mdPath}`)
        console.log(`Issues rendered: ${summary.issues}`)
        console.log(`Comments rendered: ${summary.comments}`)
        reportSkipped('Raw files', raw.skippedFiles)
    })
