import { plugin } from 'bun'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { resolveWorkspaceWidgetsPath, toPathSegment } from '@zoho-studio/core'

import type { WidgetDescription, WidgetScenario } from '../widget.types'
import {
    defineWidgetScenario,
    parseWidgetDescription,
    widgetDescriptionFileName,
    widgetFixturesDirName,
    widgetScenariosDirName,
} from '../widget.utils'

export function resolveWidgetDirPath(projectPath: string, widgetName: string): string {
    return join(resolveWorkspaceWidgetsPath(projectPath), toPathSegment(widgetName))
}

/** Every folder under `widgets/` with a `widget.json`, ordered by name; no `widgets/` means none. */
export async function listLocalWidgets(projectPath: string): Promise<WidgetDescription[]> {
    const entries = await readdir(resolveWorkspaceWidgetsPath(projectPath), { withFileTypes: true }).catch(() => [])
    const widgets: WidgetDescription[] = []

    for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
        if (await Bun.file(join(resolveWidgetDirPath(projectPath, entry.name), widgetDescriptionFileName)).exists()) {
            widgets.push(await readLocalWidget(projectPath, entry.name))
        }
    }

    return widgets
}

export async function readLocalWidget(projectPath: string, widgetName: string): Promise<WidgetDescription> {
    const file = Bun.file(join(resolveWidgetDirPath(projectPath, widgetName), widgetDescriptionFileName))

    if (!(await file.exists())) {
        throw new Error(`Widget "${widgetName}" has no widgets/${widgetName}/${widgetDescriptionFileName}.`)
    }

    return parseWidgetDescription(widgetName, await file.json().catch(() => null))
}

/** Scenario names are the `.ts` files in `widgets/<name>/scenarios/`, without the extension. */
export async function listWidgetScenarios(projectPath: string, widgetName: string): Promise<string[]> {
    const scenariosPath = join(resolveWidgetDirPath(projectPath, widgetName), widgetScenariosDirName)
    const fileNames = await readdir(scenariosPath).catch(() => [])

    return fileNames
        .filter((fileName) => fileName.endsWith('.ts'))
        .map((fileName) => fileName.slice(0, -'.ts'.length))
        .sort()
}

/**
 * Imports a scenario afresh on every session, so an edited file applies without a restart.
 * No scenario name means an empty scenario: defaults only.
 */
export async function loadWidgetScenario(
    projectPath: string,
    widgetName: string,
    scenarioName?: string
): Promise<WidgetScenario> {
    if (!scenarioName) {
        return {}
    }

    const scenarioPath = join(
        resolveWidgetDirPath(projectPath, widgetName),
        widgetScenariosDirName,
        `${toPathSegment(scenarioName)}.ts`
    )

    if (!(await Bun.file(scenarioPath).exists())) {
        throw new Error(`Scenario "${scenarioName}" of widget "${widgetName}" is not in ${scenarioPath}.`)
    }

    const module = await importScenarioModule(scenarioPath)
    const scenario = module.default as WidgetScenario | undefined

    if (!scenario || typeof scenario !== 'object') {
        throw new Error(
            `${scenarioPath} must export a scenario as default: export default defineWidgetScenario({ ... }).`
        )
    }

    return scenario
}

const widgetSubpath = '@zoho-studio/zoho-crm/widget'
let widgetSubpathProvided = false

/**
 * The compiled `zoho-studio` cannot resolve the project's `node_modules` for a file it imports at
 * run time, so a scenario's `import { defineWidgetScenario } from '@zoho-studio/zoho-crm/widget'`
 * fails there. That function only returns its argument, so the binary provides it itself.
 */
async function importScenarioModule(scenarioPath: string): Promise<{ default?: unknown }> {
    try {
        return await import(`${scenarioPath}?at=${Date.now()}`)
    } catch (error) {
        if (widgetSubpathProvided || !String(error).includes(`Cannot find module '${widgetSubpath}'`)) {
            throw error
        }

        plugin({
            name: 'zoho-studio-widget-scenario',
            setup(build) {
                build.module(widgetSubpath, () => ({ exports: { defineWidgetScenario }, loader: 'object' }))
            },
        })
        widgetSubpathProvided = true

        // A failed import stays cached under its specifier, so the retry asks for a new one.
        return import(`${scenarioPath}?at=${Date.now()}-retry`)
    }
}

/** Records of one module the widget's API calls answer with: `widgets/<name>/fixtures/<Module>.json`, an array. */
export async function readWidgetFixtureRecords(
    projectPath: string,
    widgetName: string,
    moduleName: string
): Promise<Record<string, unknown>[] | null> {
    const file = Bun.file(
        join(resolveWidgetDirPath(projectPath, widgetName), widgetFixturesDirName, `${toPathSegment(moduleName)}.json`)
    )

    if (!(await file.exists())) {
        return null
    }

    const records = await file.json()

    if (!Array.isArray(records)) {
        throw new Error(
            `widgets/${widgetName}/${widgetFixturesDirName}/${moduleName}.json must be an array of records.`
        )
    }

    return records
}
