import { getProjectSettings } from '@/settings'
import { describeProjectsRequestError } from '@/shared/api/projects'
import { createCommandLogger } from '@/shared/logger'
import type { PullProgress, PullResult } from '@/shared/pull'
import { createMilestoneResolver } from '@/zoho-projects/entities/milestone'
import { describeSkipped, type SkippedEntity, writeRawEntity } from '@/zoho-projects/raw'

import { getTaskListsList } from '../api'
import { resolveTaskListParentSegments } from '../task-list.utils'

export async function pullTaskLists(progress: PullProgress): Promise<PullResult> {
    const logger = await createCommandLogger('z-projects:task-lists:pull')
    logger.info('Starting task lists pull')

    const { projectPath } = await getProjectSettings()
    const taskLists = await getTaskListsList()

    logger.info({ taskLists: taskLists.length }, 'Task lists found')

    const milestones = createMilestoneResolver(projectPath)
    const skipped: SkippedEntity[] = []

    progress.start(taskLists.length)

    try {
        for (const taskList of taskLists) {
            progress.update(taskList.name)

            try {
                const parentSegments = await resolveTaskListParentSegments(taskList, milestones)
                const segments = await writeRawEntity(projectPath, parentSegments, taskList)

                logger.debug({ id: taskList.id, path: segments.join('/') }, 'Task list saved')
            } catch (error) {
                const message = describeProjectsRequestError(error)

                skipped.push({ id: taskList.id, name: taskList.name, message })
                logger.error({ message, taskList: taskList.id, milestone: taskList.milestone?.id }, 'Task list skipped')
            }

            progress.increment()
        }
    } finally {
        progress.stop()
    }

    const saved = taskLists.length - skipped.length

    logger.info({ taskLists: taskLists.length, saved, skipped: skipped.length }, 'Task lists pull finished')

    return {
        summary: [
            `Task lists found: ${taskLists.length}`,
            `Task lists saved: ${saved}`,
            ...describeSkipped('Task lists', skipped),
        ],
        failedCount: skipped.length,
    }
}
