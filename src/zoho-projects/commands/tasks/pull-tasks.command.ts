import cliProgress from 'cli-progress'
import { Command } from 'commander'

import { createMilestoneResolver } from '@/zoho-projects/entities/milestone'
import { createTaskListResolver } from '@/zoho-projects/entities/task-list'
import {
    getTaskCommentsList,
    getTasksList,
    isTaskInPeriod,
    parseTaskPeriod,
    resolveTaskParentSegments,
    writeTask,
} from '@/zoho-projects/entities/task'
import { getProjectSettings } from '@/settings'
import { describeProjectsRequestError } from '@/shared/api/projects'
import { reportSkipped, type SkippedEntity } from '@/zoho-projects/raw'
import { createCommandLogger } from '@/shared/logger'

export const pullTasksCommand = new Command('z-projects:tasks:pull')
    .description(
        'Download the tasks of the configured Zoho Projects project, with their comments, as raw JSON. ' +
            'Without --from/--to every task is pulled; with them only the tasks last modified in that period (dates as YYYY-MM-DD, inclusive, UTC)'
    )
    .option('--from <YYYY-MM-DD>', 'Only tasks last modified on or after this UTC date')
    .option('--to <YYYY-MM-DD>', 'Only tasks last modified on or before this UTC date')
    .action(async (options: { from?: string; to?: string }) => {
        const period = parseTaskPeriod(options)
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
        const progressBar = new cliProgress.SingleBar(
            {
                format: 'Pulling tasks |{bar}| {value}/{total} | {name}',
                hideCursor: true,
                clearOnComplete: false,
            },
            cliProgress.Presets.shades_classic
        )

        progressBar.start(tasks.length, 0, { name: 'Starting...' })

        try {
            for (const task of tasks) {
                progressBar.update({ name: task.name })

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

                progressBar.increment()
            }
        } finally {
            progressBar.stop()
        }

        const savedTasks = tasks.length - skipped.length

        logger.info({ tasks: tasks.length, savedTasks, savedComments, skipped: skipped.length }, 'Tasks pull finished')
        console.log(`Tasks found: ${totalTasks}`)
        console.log(`Tasks in period: ${tasks.length}`)
        console.log(`Tasks saved: ${savedTasks}`)
        console.log(`Comments saved: ${savedComments}`)
        reportSkipped('Tasks', skipped)
    })
