import { Command } from 'commander'

import { mdDirName, zohoProjectsDirName } from '@/zoho-projects/zoho-projects.config'
import { renderMilestoneIndex, type IndexRenderContext } from '@/zoho-projects/entities/milestone'
import { renderTaskListIndex } from '@/zoho-projects/entities/task-list'
import { loadRawTree, renderTask, type TreeTask } from '@/zoho-projects/entities/task'
import { getProjectSettings } from '@/settings'
import { replaceArtifactDir, writeArtifactText } from '@/shared/artifacts'
import { createCommandLogger } from '@/shared/logger'

const mdSegments = [zohoProjectsDirName, mdDirName]

export const renderTasksCommand = new Command('z-projects:tasks:render')
    .description('Build the Obsidian markdown catalogue in src/zoho-projects/md/ from the raw Zoho Projects JSON')
    .action(async () => {
        const logger = await createCommandLogger('z-projects:tasks:render')
        logger.info('Starting tasks render')

        const { projectPath, settings } = await getProjectSettings()
        const { portalId, projectId } = settings.projects

        for (const [field, value] of Object.entries({ portalId, projectId })) {
            if (!value) {
                throw new Error(`projects.${field} is empty in .zoho-studio/settings.json.`)
            }
        }

        const tree = await loadRawTree(projectPath)
        const tasksById = new Map<string, TreeTask>()

        for (const milestone of tree.milestones) {
            for (const taskList of milestone.taskLists) {
                for (const status of taskList.statuses) {
                    for (const task of status.tasks) {
                        tasksById.set(task.record.id, task)
                    }
                }
            }
        }

        if (tree.milestones.length === 0) {
            console.log('Nothing to render: src/zoho-projects/raw/ is empty. Run the z-projects:*:pull commands first.')
            return
        }

        const context: IndexRenderContext = {
            projects: { portalId, projectId },
            projectName: resolveProjectName(tasksById),
            renderedAt: new Date().toISOString().slice(0, 10),
        }
        let taskLists = 0
        let comments = 0

        // md/ is derived from raw/ and a task moves folders when its status changes, so it is rebuilt whole.
        await replaceArtifactDir(projectPath, mdSegments)

        for (const milestone of tree.milestones) {
            const index = renderMilestoneIndex(milestone, context)

            await writeArtifactText(projectPath, [...mdSegments, ...index.segments], index.content)

            for (const taskList of milestone.taskLists) {
                const taskListIndex = renderTaskListIndex(taskList, milestone, context)

                await writeArtifactText(projectPath, [...mdSegments, ...taskListIndex.segments], taskListIndex.content)
                taskLists += 1

                for (const status of taskList.statuses) {
                    for (const task of status.tasks) {
                        const rendered = renderTask(task, {
                            projects: context.projects,
                            milestone,
                            taskList,
                            status,
                            tasksById,
                        })

                        await writeArtifactText(projectPath, [...mdSegments, ...rendered.segments], rendered.content)
                        comments += task.comments.length
                    }
                }
            }
        }

        const summary = {
            milestones: tree.milestones.length,
            taskLists,
            tasks: tasksById.size,
            comments,
            skippedFiles: tree.skippedFiles.length,
        }

        logger.info(summary, 'Tasks render finished')
        console.log(`Milestones rendered: ${summary.milestones}`)
        console.log(`Task lists rendered: ${summary.taskLists}`)
        console.log(`Tasks rendered: ${summary.tasks}`)
        console.log(`Comments rendered: ${summary.comments}`)
        console.log(`Raw files skipped: ${summary.skippedFiles}`)

        for (const file of tree.skippedFiles) {
            console.log(`  - ${file}`)
        }

        if (tree.skippedFiles.length > 0) {
            process.exitCode = 1
        }
    })

/** Every task names its project; the first one seen is as good as any. */
function resolveProjectName(tasksById: Map<string, TreeTask>): string | null {
    for (const task of tasksById.values()) {
        const project = task.record.project as { name?: string } | undefined

        if (project?.name) {
            return project.name
        }
    }

    return null
}
