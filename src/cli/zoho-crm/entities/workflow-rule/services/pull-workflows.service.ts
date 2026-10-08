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
import type { PullProgress, PullResult } from '@/shared/pull'
import { assertModuleName, delay } from '@/shared/utils'
import { workflowsDirName, zohoCrmDirName } from '@/zoho-crm/zoho-crm.config'

import { getWorkflowRule, getWorkflowRulesList } from '../api'
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
        workflowRules = sortForStableFileNames(await getWorkflowRulesList(module))
    } catch (error) {
        logger.error({ err: error }, 'Failed to fetch the workflow rules list')
        throw new Error(describeRequestError(error), { cause: error })
    }

    logger.info({ total: workflowRules.length }, 'Workflow rules found')

    // A full pull mirrors what Zoho returned; a single-module pull may only drop that module.
    const takenFileNames = module
        ? await removeModuleArtifactFiles(
              await ensureArtifactDir(projectPath, [zohoCrmDirName, workflowsDirName]),
              module
          )
        : await emptyWorkflowsDir(projectPath)

    const failed: FailedRule[] = []
    let savedRules = 0
    progress.start(workflowRules.length)

    try {
        for (const [index, workflowRule] of workflowRules.entries()) {
            if (index > 0) {
                await delay(delayBetweenRuleRequestsMs)
            }

            progress.update(workflowRule.name)

            try {
                // The list carries no conditions or actions, so the full record is fetched per rule.
                const details = await getWorkflowRule(workflowRule.id)
                const fileName = resolveArtifactFileName(workflowRule.name, workflowRule.id, takenFileNames)

                await writeArtifactJson(projectPath, [zohoCrmDirName, workflowsDirName, fileName], details)

                takenFileNames.add(fileName)
                savedRules += 1
            } catch (error) {
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

    return {
        summary: [
            `Workflow rules found: ${workflowRules.length}`,
            `Workflow rules saved: ${savedRules}`,
            `Workflow rules failed: ${failed.length}`,
            ...failed.map((failure) => `  - ${failure.name}: ${failure.message}`),
        ],
        failedCount: failed.length,
    }
}

async function emptyWorkflowsDir(projectPath: string): Promise<Set<string>> {
    await replaceArtifactDir(projectPath, [zohoCrmDirName, workflowsDirName])

    return new Set()
}
