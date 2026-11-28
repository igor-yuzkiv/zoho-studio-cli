import { getProjectSettings } from '@zoho-studio/core'
import { describeRequestError } from '../../../api'
import {
    isRecordOfModule,
    openArtifactSnapshot,
    resolveArtifactFileName,
    sortForStableFileNames,
    summarizeRemovedArtifacts,
} from '@zoho-studio/core'
import { createCommandLogger } from '@zoho-studio/core'
import type { PullProgress, PullResult } from '@zoho-studio/core'
import { assertModuleName, delay } from '@zoho-studio/core'
import { workflowsDirName, zohoCrmDirName } from '../../../zoho-crm.config'

import { getWorkflowRuleRequest, getWorkflowRulesListRequest } from '../api'
import type { ZohoWorkflowRule } from '../workflow-rule.types'

const delayBetweenRuleRequestsMs = 300

type FailedRule = {
    name: string
    message: string
}

export type PullWorkflowsOptions = { module?: string }

export async function pullWorkflows(options: PullWorkflowsOptions, progress: PullProgress): Promise<PullResult> {
    const logger = await createCommandLogger('z-crm:workflows:pull')
    logger.info({ module: options.module ?? null }, 'Starting workflow rules pull')

    const { projectPath } = await getProjectSettings()
    const module = options.module ? assertModuleName(options.module) : undefined

    let workflowRules: ZohoWorkflowRule[]

    try {
        workflowRules = sortForStableFileNames(await getWorkflowRulesListRequest(module))
    } catch (error) {
        logger.error({ err: error }, 'Failed to fetch the workflow rules list')
        throw new Error(describeRequestError(error), { cause: error })
    }

    logger.info({ total: workflowRules.length }, 'Workflow rules found')

    // A full pull mirrors what Zoho returned; a single-module pull owns only that module's rules.
    const snapshot = await openArtifactSnapshot(projectPath, [zohoCrmDirName, workflowsDirName], {
        owns: module ? (record) => isRecordOfModule(record, module) : undefined,
    })
    const takenFileNames = new Set(snapshot.keptFileNames)

    const failed: FailedRule[] = []
    let savedRules = 0
    progress.start(workflowRules.length)

    try {
        for (const [index, workflowRule] of workflowRules.entries()) {
            if (index > 0) {
                await delay(delayBetweenRuleRequestsMs)
            }

            progress.update(workflowRule.name)

            const fileName = resolveArtifactFileName(workflowRule.name, workflowRule.id, takenFileNames)
            takenFileNames.add(fileName)

            try {
                // The list carries no conditions or actions, so the full record is fetched per rule.
                const details = await getWorkflowRuleRequest(workflowRule.id)

                await snapshot.writeJson([zohoCrmDirName, workflowsDirName, fileName], details)

                savedRules += 1
            } catch (error) {
                snapshot.keep([zohoCrmDirName, workflowsDirName, fileName])
                failed.push({ name: workflowRule.name, message: describeRequestError(error) })
                logger.error({ err: error, rule: workflowRule.name }, 'Failed to pull a workflow rule')
            }

            progress.increment()
        }
    } finally {
        progress.stop()
    }

    logger.info(
        { total: workflowRules.length, saved: savedRules, failed: failed.length },
        'Workflow rules pull finished'
    )

    const removedPaths = await snapshot.close()

    return {
        summary: [
            `Workflow rules found: ${workflowRules.length}`,
            `Workflow rules saved: ${savedRules}`,
            `Workflow rules failed: ${failed.length}`,
            ...failed.map((failure) => `  - ${failure.name}: ${failure.message}`),
            ...summarizeRemovedArtifacts(removedPaths),
        ],
        failedCount: failed.length,
        removedPaths,
    }
}

