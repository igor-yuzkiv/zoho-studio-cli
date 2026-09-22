import { Command } from 'commander'

import { renderMilestoneIndex, type IndexRenderContext } from '@/zoho-projects/entities/milestone'
import { renderTaskListIndex } from '@/zoho-projects/entities/task-list'
import { loadRawTree, renderTask } from '@/zoho-projects/entities/task'
import { removeFileFromOtherStatuses, resolveMdPath, writeMdFile } from '@/zoho-projects/md'
import { reportSkipped } from '@/zoho-projects/raw'
import { getProjectSettings } from '@/settings'
import { assertProjectsConfigured } from '@/shared/api/projects'
import { createCommandLogger } from '@/shared/logger'

export const renderTasksCommand = new Command('z-projects:tasks:render')
    .description(
        'Build the Obsidian markdown catalogue from the raw Zoho Projects JSON, in src/zoho-projects/md/ or the folder projects.mdPath names'
    )
    .action(async () => {
        const logger = await createCommandLogger('z-projects:tasks:render')
        logger.info('Starting tasks render')

        const { projectPath, settings } = await getProjectSettings()

        assertProjectsConfigured(settings.projects)

        const mdPath = resolveMdPath(projectPath, settings.projects.mdPath)

        const tree = await loadRawTree(projectPath)

        if (tree.milestones.length === 0 && tree.skippedFiles.length === 0) {
            console.log('Nothing to render: src/zoho-projects/raw/ is empty. Run the z-projects:*:pull commands first.')
            return
        }

        const context: IndexRenderContext = {
            projects: settings.projects,
            projectName: tree.projectName,
            renderedAt: new Date().toISOString().slice(0, 10),
        }
        let taskLists = 0
        let comments = 0

        for (const milestone of tree.milestones) {
            const index = renderMilestoneIndex(milestone, context)

            await writeMdFile(mdPath, index.segments, index.content)

            for (const taskList of milestone.taskLists) {
                const taskListIndex = renderTaskListIndex(taskList, milestone, context)

                await writeMdFile(mdPath, taskListIndex.segments, taskListIndex.content)
                taskLists += 1

                for (const status of taskList.statuses) {
                    for (const task of status.tasks) {
                        const rendered = renderTask(task, {
                            projects: settings.projects,
                            milestone,
                            taskList,
                            status,
                            tasksById: tree.tasksById,
                        })

                        await removeFileFromOtherStatuses(mdPath, rendered.segments)
                        await writeMdFile(mdPath, rendered.segments, rendered.content)
                        comments += task.comments.length
                    }
                }
            }
        }

        const summary = {
            milestones: tree.milestones.length,
            taskLists,
            tasks: tree.tasksById.size,
            comments,
            skippedFiles: tree.skippedFiles.length,
        }

        logger.info(summary, 'Tasks render finished')
        console.log(`Catalogue written to: ${mdPath}`)
        console.log(`Milestones rendered: ${summary.milestones}`)
        console.log(`Task lists rendered: ${summary.taskLists}`)
        console.log(`Tasks rendered: ${summary.tasks}`)
        console.log(`Comments rendered: ${summary.comments}`)
        reportSkipped('Raw files', tree.skippedFiles)
    })
