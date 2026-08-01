import cliProgress from 'cli-progress'
import { Command } from 'commander'

import { workflowActionsDirName } from '@/config'
import {
    getWorkflowAction,
    getWorkflowActionsList,
    workflowActionTypes,
    type WorkflowActionType,
    type ZohoWorkflowAction,
} from '@/entities/workflow-action'
import { getProjectSettings } from '@/settings'
import { describeRequestError } from '@/shared/api/crm'
import {
    ensureArtifactDir,
    removeModuleArtifactFiles,
    replaceArtifactDir,
    resolveArtifactFileName,
    sortForStableFileNames,
    writeArtifactJson,
} from '@/shared/artifacts'
import { createCommandLogger } from '@/shared/logger'
import { assertModuleName, delay } from '@/shared/utils'

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

export const pullWorkflowActionsCommand = new Command('workflow-actions:pull')
    .description('Download every Zoho CRM workflow action, with its full configuration, into the project')
    .option('--module <api_name>', 'Pull the workflow actions of a single module')
    .option('--type <action_type>', `Pull a single action type (${workflowActionTypes.join(', ')})`)
    .action(async (options: { module?: string; type?: string }) => {
        const logger = await createCommandLogger('workflow-actions:pull')
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
        const progressBar = new cliProgress.SingleBar(
            {
                format: 'Pulling workflow actions |{bar}| {value}/{total} | {name}',
                hideCursor: true,
                clearOnComplete: false,
            },
            cliProgress.Presets.shades_classic
        )

        progressBar.start(pending.length, 0, { name: 'Starting...' })

        try {
            for (const [index, { type, action, takenFileNames }] of pending.entries()) {
                if (index > 0) {
                    await delay(delayBetweenActionRequestsMs)
                }

                progressBar.update({ name: `${type}: ${action.name}` })

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
                        [workflowActionsDirName, toWorkflowActionDirName(type), fileName],
                        details ?? action
                    )

                    takenFileNames.add(fileName)
                    savedActions += 1
                } catch (error) {
                    failed.push({ name: `${type}: ${action.name}`, message: describePullError(error) })
                    logger.error({ err: error, type, action: action.name }, 'Failed to pull a workflow action')
                }

                progressBar.increment()
            }
        } finally {
            progressBar.stop()
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

        console.log(`Workflow actions found: ${pending.length}`)
        console.log(`Workflow actions saved: ${savedActions}`)
        console.log(`Saved from the list, because Zoho returned no details: ${savedFromList.length}`)

        for (const name of savedFromList) {
            console.log(`  - ${name}`)
        }

        console.log(`Failures: ${failed.length}`)

        for (const failure of failed) {
            console.log(`  - ${failure.name}: ${failure.message}`)
        }
    })

/** `--type` names both a Zoho endpoint and a local directory, so both spellings are accepted. */
export function assertWorkflowActionType(value: string): WorkflowActionType {
    const type = value.replace(/-/g, '_') as WorkflowActionType

    if (!workflowActionTypes.includes(type)) {
        throw new Error(`--type must be one of ${workflowActionTypes.join(', ')}, got "${value}".`)
    }

    return type
}

/** Zoho names the type with underscores; the project keeps directories in the kebab-case it uses elsewhere. */
export function toWorkflowActionDirName(type: WorkflowActionType): string {
    return type.replace(/_/g, '-')
}

/**
 * A scope the token never had reads as an ordinary rejection, although the fix is a settings change
 * followed by a new login rather than anything about this command.
 */
export function describePullError(error: unknown): string {
    const message = describeRequestError(error)

    return message.includes('OAUTH_SCOPE_MISMATCH')
        ? `${message} — add "ZohoCRM.settings.automation_actions.READ" to auth.scopes in .zoho-studio/settings.json and run "zoho-studio login" again.`
        : message
}

/** A full pull mirrors what Zoho returned; a single-module pull may only drop that module. */
async function prepareTypeDir(
    projectPath: string,
    type: WorkflowActionType,
    module: string | undefined
): Promise<Set<string>> {
    const segments = [workflowActionsDirName, toWorkflowActionDirName(type)]

    if (!module) {
        await replaceArtifactDir(projectPath, segments)

        return new Set()
    }

    return removeModuleArtifactFiles(await ensureArtifactDir(projectPath, segments), module)
}
