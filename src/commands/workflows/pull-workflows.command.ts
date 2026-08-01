import cliProgress from 'cli-progress'
import { Command } from 'commander'

import { workflowsDirName } from '@/config'
import { getWorkflowRule, getWorkflowRulesList, type ZohoWorkflowRule } from '@/entities/workflow-rule'
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
import { assertModuleName } from '@/shared/utils'

const delayBetweenRuleRequestsMs = 300

type FailedRule = {
    name: string
    message: string
}

export const pullWorkflowsCommand = new Command('workflows:pull')
    .description('Download every Zoho CRM workflow rule, with its conditions and actions, into the project')
    .option('--module <api_name>', 'Pull the workflow rules of a single module')
    .action(async (options: { module?: string }) => {
        const logger = await createCommandLogger('workflows:pull')
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
            ? await removeModuleArtifactFiles(await ensureArtifactDir(projectPath, [workflowsDirName]), module)
            : await emptyWorkflowsDir(projectPath)

        const failed: FailedRule[] = []
        let savedRules = 0
        const progressBar = new cliProgress.SingleBar(
            {
                format: 'Pulling workflow rules |{bar}| {value}/{total} | {name}',
                hideCursor: true,
                clearOnComplete: false,
            },
            cliProgress.Presets.shades_classic
        )

        progressBar.start(workflowRules.length, 0, { name: 'Starting...' })

        try {
            for (const [index, workflowRule] of workflowRules.entries()) {
                if (index > 0) {
                    await delay(delayBetweenRuleRequestsMs)
                }

                progressBar.update({ name: workflowRule.name })

                try {
                    // The list carries no conditions or actions, so the full record is fetched per rule.
                    const details = await getWorkflowRule(workflowRule.id)
                    const fileName = resolveArtifactFileName(workflowRule.name, workflowRule.id, takenFileNames)

                    await writeArtifactJson(projectPath, [workflowsDirName, fileName], details)

                    takenFileNames.add(fileName)
                    savedRules += 1
                } catch (error) {
                    failed.push({ name: workflowRule.name, message: describeRequestError(error) })
                    logger.error({ err: error, rule: workflowRule.name }, 'Failed to pull a workflow rule')
                }

                progressBar.increment()
            }
        } finally {
            progressBar.stop()
        }

        logger.info(
            { total: workflowRules.length, saved: savedRules, failed: failed.length },
            'Workflow rules pull finished'
        )

        console.log(`Workflow rules found: ${workflowRules.length}`)
        console.log(`Workflow rules saved: ${savedRules}`)
        console.log(`Workflow rules failed: ${failed.length}`)

        for (const failure of failed) {
            console.log(`  - ${failure.name}: ${failure.message}`)
        }
    })

async function emptyWorkflowsDir(projectPath: string): Promise<Set<string>> {
    await replaceArtifactDir(projectPath, [workflowsDirName])

    return new Set()
}

function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
