import { getProjectSettings } from '@/settings'
import { describeProjectsRequestError } from '@/shared/api/projects'
import { createCommandLogger } from '@/shared/logger'
import type { PullProgress, PullResult } from '@/shared/pull'
import { createMilestoneResolver } from '@/zoho-projects/entities/milestone'
import { createTaskListResolver } from '@/zoho-projects/entities/task-list'
import { parsePeriod } from '@/zoho-projects/period.utils'
import { describeSkipped, type SkippedEntity } from '@/zoho-projects/raw'

import { getTaskCommentsList, getTasksList } from '../api'
import { isTaskInPeriod, resolveTaskParentSegments, writeTask } from '../task.utils'

export type PullTasksOptions = {
    from?: string
    to?: string
}

export async function pullTasks(options: PullTasksOptions, progress: PullProgress): Promise<PullResult> {
    const period = parsePeriod(options)
    const logger = await createCommandLogger('z-projects:tasks:pull')
    logger.info({ from: options.from ?? null, to: options.to ?? null }, 'Starting tasks pull')

    const { projectPath } = await getProjectSettings()
    const allTasks = await getTasksList()
    const tasks = allTasks.filter((task) => isTaskInPeriod(task, period))
    const totalTasks = allTasks.length

    logger.info({ tasks: totalTasks, inPeriod: tasks.length }, 'Tasks found')

    const milestones = createMilestoneResolver(projectPath)
    const taskLists = createTaskListResolver(projectPath, milestones)
    const skipped: SkippedEntity[] = []
    let savedComments = 0

    progress.start(tasks.length)

    try {
        for (const task of tasks) {
            progress.update(task.name)

            try {
                const parentSegments = await resolveTaskParentSegments(task, taskLists, milestones)
                const comments = await getTaskCommentsList(task.id)
                const segments = await writeTask(projectPath, parentSegments, task, comments)

                savedComments += comments.length
                logger.debug({ id: task.id, comments: comments.length, path: segments.join('/') }, 'Task saved')
            } catch (error) {
                const message = describeProjectsRequestError(error)

                skipped.push({ id: task.id, name: task.name, message })
                logger.error({ message, task: task.id, taskList: task.tasklist?.id }, 'Task skipped')
            }

            progress.increment()
        }
    } finally {
        progress.stop()
    }

    const savedTasks = tasks.length - skipped.length

    logger.info({ tasks: tasks.length, savedTasks, savedComments, skipped: skipped.length }, 'Tasks pull finished')

    return {
        summary: [
            `Tasks found: ${totalTasks}`,
            `Tasks in period: ${tasks.length}`,
            `Tasks saved: ${savedTasks}`,
            `Comments saved: ${savedComments}`,
            ...describeSkipped('Tasks', skipped),
        ],
        failedCount: skipped.length,
    }
}
