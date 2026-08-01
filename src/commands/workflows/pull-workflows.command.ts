import { readdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'

import cliProgress from 'cli-progress'
import { Command } from 'commander'

import { workflowsDirName } from '@/config'
import { getWorkflowRule, getWorkflowRulesList, type ZohoWorkflowRule } from '@/entities/workflow-rule'
import { getProjectSettings } from '@/settings'
import { ensureArtifactDir, replaceArtifactDir, writeArtifactJson } from '@/shared/artifacts'
import { createCommandLogger } from '@/shared/logger'

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
            workflowRules = sortWorkflowRules(await getWorkflowRulesList(module))
        } catch (error) {
            logger.error({ err: error }, 'Failed to fetch the workflow rules list')
            throw new Error(describeRequestError(error), { cause: error })
        }

        logger.info({ total: workflowRules.length }, 'Workflow rules found')

        // A full pull mirrors what Zoho returned; a single-module pull may only drop that module.
        const takenFileNames = module
            ? await removeModuleRuleFiles(await ensureArtifactDir(projectPath, [workflowsDirName]), module)
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
                    const fileName = resolveRuleFileName(workflowRule.name, workflowRule.id, takenFileNames)

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

/** `--module` decides which local files are dropped, so anything but a plain module name is refused. */
export function assertModuleName(moduleName: string): string {
    if (!moduleName || moduleName === '.' || moduleName === '..' || /[/\\\0]/.test(moduleName)) {
        throw new Error(`--module must be a module API name, got "${moduleName}".`)
    }

    return moduleName
}

/**
 * Rule names are unique per module, not per organization, so a flat directory can collide. The
 * second claimant of a name carries the rule id instead of overwriting the first one.
 */
export function resolveRuleFileName(name: string, id: string, takenFileNames: Set<string>): string {
    const baseName = toFileBaseName(name, id)
    const fileName = `${baseName}.json`

    return takenFileNames.has(fileName) ? `${baseName}.${id}.json` : fileName
}

/** Ordered so that a name collision is always resolved the same way between runs. */
export function sortWorkflowRules(workflowRules: ZohoWorkflowRule[]): ZohoWorkflowRule[] {
    return [...workflowRules].sort(
        (left, right) =>
            (left.module?.api_name ?? '').localeCompare(right.module?.api_name ?? '') ||
            left.name.localeCompare(right.name) ||
            left.id.localeCompare(right.id)
    )
}

/** Zoho reports a rejected request as an HTTP error whose body explains it far better than the status. */
export function describeRequestError(error: unknown): string {
    const payload = (error as { response?: { data?: { message?: unknown; code?: unknown } } })?.response?.data
    const message = typeof payload?.message === 'string' ? payload.message : null
    const code = typeof payload?.code === 'string' ? payload.code : null

    if (message) {
        return code ? `${message} (${code})` : message
    }

    return error instanceof Error ? error.message : String(error)
}

async function emptyWorkflowsDir(projectPath: string): Promise<Set<string>> {
    await replaceArtifactDir(projectPath, [workflowsDirName])

    return new Set()
}

/**
 * The directory is flat and a file is named after its rule, so the owning module is read back out
 * of the file itself. A file that cannot be read as a rule is left alone rather than guessed about.
 */
export async function removeModuleRuleFiles(workflowsPath: string, module: string): Promise<Set<string>> {
    const entries = await readdir(workflowsPath, { withFileTypes: true })
    const survivingFileNames = new Set<string>()

    for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.json')) {
            continue
        }

        const filePath = join(workflowsPath, entry.name)
        const storedRule = await Bun.file(filePath)
            .json()
            .catch(() => null)

        if (storedRule?.module?.api_name === module) {
            await unlink(filePath)
        } else {
            survivingFileNames.add(entry.name)
        }
    }

    return survivingFileNames
}

function toFileBaseName(name: string, id: string): string {
    const baseName = name.replace(/[/\\\0]/g, '_').trim()

    return !baseName || baseName === '.' || baseName === '..' ? id : baseName
}

function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
