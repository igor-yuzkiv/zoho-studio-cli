import { Command } from 'commander'

import { createMilestoneResolver } from '@/zoho-projects/entities/milestone'
import { getTaskListsList, resolveTaskListParentSegments } from '@/zoho-projects/entities/task-list'
import { getProjectSettings } from '@/settings'
import { describeProjectsRequestError } from '@/shared/api/projects'
import { reportSkipped, type SkippedEntity, writeRawEntity } from '@/zoho-projects/raw'
import { createCommandLogger } from '@/shared/logger'

export const pullTaskListsCommand = new Command('z-projects:task-lists:pull')
    .description('Download every task list of the configured Zoho Projects project as raw JSON, under its milestone')
    .action(async () => {
        const logger = await createCommandLogger('z-projects:task-lists:pull')
        logger.info('Starting task lists pull')

        const { projectPath } = await getProjectSettings()
        const taskLists = await getTaskListsList()

        logger.info({ taskLists: taskLists.length }, 'Task lists found')

        const milestones = createMilestoneResolver(projectPath)
        const skipped: SkippedEntity[] = []

        for (const taskList of taskLists) {
            try {
                const parentSegments = await resolveTaskListParentSegments(taskList, milestones)
                const segments = await writeRawEntity(projectPath, parentSegments, taskList)

                logger.debug({ id: taskList.id, path: segments.join('/') }, 'Task list saved')
            } catch (error) {
                const message = describeProjectsRequestError(error)

                skipped.push({ id: taskList.id, name: taskList.name, message })
                logger.error({ message, taskList: taskList.id, milestone: taskList.milestone?.id }, 'Task list skipped')
            }
        }

        const saved = taskLists.length - skipped.length

        logger.info({ taskLists: taskLists.length, saved, skipped: skipped.length }, 'Task lists pull finished')
        console.log(`Task lists found: ${taskLists.length}`)
        console.log(`Task lists saved: ${saved}`)
        reportSkipped('Task lists', skipped)
    })
