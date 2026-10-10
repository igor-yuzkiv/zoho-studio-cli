import { Command } from 'commander'

import { loadRawIssues, renderIssue, renderIssuesIndex } from '@zoho-studio/zoho-projects'
import type { IndexRenderContext } from '@zoho-studio/zoho-projects'
import { loadRawTree } from '@zoho-studio/zoho-projects'
import { removeFileFromOtherStatuses, resolveMdPath, writeMdFile } from '@zoho-studio/zoho-projects'
import { reportSkipped } from '@zoho-studio/zoho-projects'
import { getProjectSettings } from '@zoho-studio/core'
import { assertProjectsConfigured } from '@zoho-studio/zoho-projects'
import { createCommandLogger } from '@zoho-studio/core'

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
