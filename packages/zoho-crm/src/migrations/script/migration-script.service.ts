import { parseArgs } from 'node:util'

import { confirm, select } from '@inquirer/prompts'

import { getProjectSettings } from '@zoho-studio/core'

import { getOrganizationRequest } from '../../entities/organization'
import { readMigrationJournal } from '../journal'
import { listMigrations } from '../loader'
import { prepareMigration, type PreparedMigration } from '../planning'
import { runMigration, type MigrationEvent } from '../running'

import { formatMigrationEvent, formatPreparedMigration } from './migration-script.utils'

interface ScriptOptions {
    name?: string
    dryRun: boolean
    yes: boolean
    json: boolean
}

/** Every line the script prints in `--json` mode is one of these. */
export type MigrationScriptEvent = { type: 'prepared'; migration: PreparedMigration } | MigrationEvent

/**
 * The whole `bun run migrate` script of a project: pick a migration, show its plan, confirm, run it.
 * It lives in the package so that a fix reaches every linked project. Returns the exit code.
 */
export async function runMigrationScript(argv: string[] = process.argv.slice(2)): Promise<number> {
    const options = parseScriptOptions(argv)

    if (options.json && (!options.name || !(options.yes || options.dryRun))) {
        console.error('--json runs without prompts, so it needs a migration name and --yes or --dry-run.')
        return 1
    }

    const { projectPath } = await getProjectSettings()
    const name = options.name ?? (await chooseMigration(projectPath))

    if (!name) {
        return 0
    }

    const prepared = await prepareMigration(projectPath, name)
    const print = options.json
        ? (event: MigrationScriptEvent) => console.log(JSON.stringify(event))
        : (event: MigrationScriptEvent) => {
              const lines =
                  event.type === 'prepared'
                      ? formatPreparedMigration(event.migration)
                      : formatMigrationEvent(event, prepared.plan?.steps.length ?? 0)
              lines.forEach((line) => console.log(line))
          }

    print({ type: 'prepared', migration: prepared })

    if (prepared.conflicts.length > 0) {
        // A blocked run sends nothing to Zoho; it only reports the block, so every stream ends with `finished`.
        await runMigration(projectPath, prepared, print)
        return 1
    }

    if (options.dryRun) {
        return 0
    }

    if (!options.yes && !(await confirm({ message: `Run migration "${name}"?`, default: false }))) {
        return 0
    }

    const status = await runMigration(projectPath, prepared, print)

    return status === 'applied' ? 0 : 1
}

function parseScriptOptions(argv: string[]): ScriptOptions {
    const { values, positionals } = parseArgs({
        args: argv,
        allowPositionals: true,
        options: {
            'dry-run': { type: 'boolean', default: false },
            yes: { type: 'boolean', short: 'y', default: false },
            json: { type: 'boolean', default: false },
        },
    })

    return { name: positionals[0], dryRun: values['dry-run'], yes: values.yes, json: values.json }
}

async function chooseMigration(projectPath: string): Promise<string | null> {
    const names = await listMigrations(projectPath)

    if (names.length === 0) {
        console.log('No migrations in migrations/zoho-crm yet.')
        return null
    }

    const journal = await readMigrationJournal(projectPath, (await getOrganizationRequest()).id ?? 'unknown')

    return select({
        message: 'Migration to run',
        choices: names.map((name) => {
            const entry = journal[name]

            return {
                name: entry?.status === 'failed' ? `${name} (failed)` : name,
                value: name,
                disabled: entry?.status === 'applied' ? `applied ${entry.ranAt}` : false,
            }
        }),
    })
}
