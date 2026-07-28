import { mkdir, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

import cliProgress from 'cli-progress'
import { Command } from 'commander'

import { getFieldsList } from '@/entities/field'
import { getProjectSettings } from '@/settings'
import { createCommandLogger } from '@/shared/logger'
import { resolveProjectDirPath, writeJsonFile } from '@/shared/utils'

const delayBetweenModuleRequestsMs = 300
const fieldsDirName = 'fields'

type FailedModule = {
    apiName: string
    message: string
}

export const pullFieldsCommand = new Command('fields:pull')
    .description('Download the fields of every local module into its own fields directory')
    .option('--module <api_name>', 'Pull the fields of a single module')
    .action(async (options: { module?: string }) => {
        const logger = await createCommandLogger('fields:pull')
        logger.info({ module: options.module ?? null }, 'Starting fields pull')

        const { projectPath, settings } = await getProjectSettings()
        const modulesPath = resolveProjectDirPath(projectPath, settings.crm.modules.root_dir, 'crm.modules.root_dir')

        const moduleNames = options.module
            ? [await resolveRequestedModule(modulesPath, options.module, settings.crm.modules.root_dir)]
            : await readLocalModuleNames(modulesPath, settings.crm.modules.root_dir)

        logger.info({ modules: moduleNames.length }, 'Local modules found')

        const failed: FailedModule[] = []
        let savedFields = 0
        const progressBar = new cliProgress.SingleBar(
            {
                format: 'Pulling fields |{bar}| {value}/{total} | {name}',
                hideCursor: true,
                clearOnComplete: false,
            },
            cliProgress.Presets.shades_classic
        )

        progressBar.start(moduleNames.length, 0, { name: 'Starting...' })

        try {
            for (const [index, moduleName] of moduleNames.entries()) {
                if (index > 0) {
                    await delay(delayBetweenModuleRequestsMs)
                }

                progressBar.update({ name: moduleName })

                try {
                    const fields = await getFieldsList(moduleName)
                    const fieldsPath = join(modulesPath, moduleName, fieldsDirName)

                    // Rewritten only once the module answered, so a failed pull keeps the previous snapshot.
                    await rm(fieldsPath, { recursive: true, force: true })
                    await mkdir(fieldsPath, { recursive: true })

                    for (const field of fields) {
                        await writeJsonFile(join(fieldsPath, resolveFieldFileName(field.api_name)), field)
                    }

                    savedFields += fields.length
                } catch (error) {
                    failed.push({
                        apiName: moduleName,
                        message: error instanceof Error ? error.message : String(error),
                    })
                    logger.error({ err: error, module: moduleName }, 'Failed to pull module fields')
                }

                progressBar.increment()
            }
        } finally {
            progressBar.stop()
        }

        logger.info(
            { modules: moduleNames.length, fields: savedFields, failed: failed.length },
            'Fields pull finished'
        )

        console.log(`Modules processed: ${moduleNames.length}`)
        console.log(`Fields saved: ${savedFields}`)
        console.log(`Modules failed: ${failed.length}`)

        for (const failure of failed) {
            console.log(`  - ${failure.apiName}: ${failure.message}`)
        }
    })

/** `--module` names a directory inside the modules root, so anything but a plain segment is refused. */
export function assertModuleName(moduleName: string): string {
    if (!moduleName || moduleName === '.' || moduleName === '..' || /[/\\\0]/.test(moduleName)) {
        throw new Error(`--module must be a module API name, got "${moduleName}".`)
    }

    return moduleName
}

export function resolveFieldFileName(fieldApiName: string): string {
    return `${fieldApiName.replace(/[/\\\0]/g, '_')}.json`
}

async function readLocalModuleNames(modulesPath: string, rootDir: string): Promise<string[]> {
    const entries = await readdir(modulesPath, { withFileTypes: true }).catch(() => null)
    const moduleNames = (entries ?? [])
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()

    if (moduleNames.length === 0) {
        throw new Error(`No modules found in "${rootDir}". Run "zoho-studio modules:pull" first.`)
    }

    return moduleNames
}

async function resolveRequestedModule(modulesPath: string, requested: string, rootDir: string): Promise<string> {
    const moduleName = assertModuleName(requested)
    const entries = await readdir(modulesPath, { withFileTypes: true }).catch(() => null)
    const exists = (entries ?? []).some((entry) => entry.isDirectory() && entry.name === moduleName)

    if (!exists) {
        throw new Error(`Module "${moduleName}" is not in "${rootDir}". Run "zoho-studio modules:pull" first.`)
    }

    return moduleName
}

function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
