import { getProjectSettings } from '@zoho-studio/core'
import {
    ensureArtifactDir,
    removeModuleArtifactFiles,
    replaceArtifactDir,
    resolveArtifactFileName,
    sortForStableFileNames,
    writeArtifactJson,
} from '@zoho-studio/core'
import { createCommandLogger } from '@zoho-studio/core'
import type { PullProgress, PullResult } from '@zoho-studio/core'
import { assertModuleName, delay } from '@zoho-studio/core'
import { workflowActionsDirName, zohoCrmDirName } from '../../../zoho-crm.config'

import { getWorkflowAction, getWorkflowActionsList } from '../api'
import { workflowActionTypes, type WorkflowActionType, type ZohoWorkflowAction } from '../workflow-action.types'
import { assertWorkflowActionType, describePullError, toWorkflowActionDirName } from '../workflow-action.utils'

const delayBetweenActionRequestsMs = 300

type PendingAction = {
    type: WorkflowActionType
    action: ZohoWorkflowAction
    /** The file names its directory already holds, so a collision resolves against them. */
    takenFileNames: Set<string>
}

/** One line of the run summary: a failure, or an action saved without its details. */
type PullNote = {
    name: string
    message: string
}

export type PullWorkflowActionsOptions = { module?: string; type?: string }

export async function pullWorkflowActions(
    options: PullWorkflowActionsOptions,
    progress: PullProgress
): Promise<PullResult> {
    const logger = await createCommandLogger('z-crm:workflow-actions:pull')
    logger.info({ module: options.module ?? null, type: options.type ?? null }, 'Starting workflow actions pull')

    const { projectPath } = await getProjectSettings()
    const module = options.module ? assertModuleName(options.module) : undefined
    const types = options.type ? [assertWorkflowActionType(options.type)] : [...workflowActionTypes]

    const failed: PullNote[] = []
    const listedByType = new Map<WorkflowActionType, ZohoWorkflowAction[]>()

    for (const [index, type] of types.entries()) {
        if (index > 0) {
            await delay(delayBetweenActionRequestsMs)
        }

        try {
            listedByType.set(type, sortForStableFileNames(await getWorkflowActionsList(type, module)))
        } catch (error) {
            failed.push({ name: type, message: describePullError(error) })
            logger.error({ err: error, type }, 'Failed to fetch a workflow actions list')
        }
    }

    // Only a type Zoho answered for is rewritten, so a failed list keeps the previous snapshot.
    const pending: PendingAction[] = []

    for (const [type, actions] of listedByType) {
        const takenFileNames = await prepareTypeDir(projectPath, type, module)

        pending.push(...actions.map((action) => ({ type, action, takenFileNames })))
    }

    logger.info({ total: pending.length, types: listedByType.size }, 'Workflow actions found')

    const savedFromList: string[] = []
    let savedActions = 0
    progress.start(pending.length)

    try {
        for (const [index, { type, action, takenFileNames }] of pending.entries()) {
            if (index > 0) {
                await delay(delayBetweenActionRequestsMs)
            }

            progress.update(`${type}: ${action.name}`)

            try {
                // The list omits what an action actually does, so the full record is fetched per action.
                const details = await getWorkflowAction(type, action.id)
                const fileName = resolveArtifactFileName(action.name, action.id, takenFileNames)

                // Zoho reports no details for some actions it lists quite normally. Keeping the
                // list entry loses nothing for a field update or a task, and for the other types
                // it keeps a partial record rather than dropping the action from the project.
                if (!details) {
                    savedFromList.push(`${type}: ${action.name}`)
                    logger.warn({ type, action: action.name }, 'Saved a workflow action from the list')
                }

                await writeArtifactJson(
                    projectPath,
                    [zohoCrmDirName, workflowActionsDirName, toWorkflowActionDirName(type), fileName],
                    details ?? action
                )

                takenFileNames.add(fileName)
                savedActions += 1
            } catch (error) {
                failed.push({ name: `${type}: ${action.name}`, message: describePullError(error) })
                logger.error({ err: error, type, action: action.name }, 'Failed to pull a workflow action')
            }

            progress.increment()
        }
    } finally {
        progress.stop()
    }

    logger.info(
        {
            total: pending.length,
            saved: savedActions,
            savedFromList: savedFromList.length,
            failed: failed.length,
        },
        'Workflow actions pull finished'
    )

    return {
        summary: [
            `Workflow actions found: ${pending.length}`,
            `Workflow actions saved: ${savedActions}`,
            `Saved from the list, because Zoho returned no details: ${savedFromList.length}`,
            ...savedFromList.map((name) => `  - ${name}`),
            `Failures: ${failed.length}`,
            ...failed.map((failure) => `  - ${failure.name}: ${failure.message}`),
        ],
        failedCount: failed.length,
    }
}

/** A full pull mirrors what Zoho returned; a single-module pull may only drop that module. */
async function prepareTypeDir(
    projectPath: string,
    type: WorkflowActionType,
    module: string | undefined
): Promise<Set<string>> {
    const segments = [zohoCrmDirName, workflowActionsDirName, toWorkflowActionDirName(type)]

    if (!module) {
        await replaceArtifactDir(projectPath, segments)

        return new Set()
    }

    return removeModuleArtifactFiles(await ensureArtifactDir(projectPath, segments), module)
}
