import { plugin } from 'bun'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

import { resolveWorkspaceWidgetsPath, toPathSegment } from '@zoho-studio/core'

import type { WidgetDescription, WidgetMocks, WidgetScenario } from '../widget.types'
import {
    defineWidgetMocks,
    defineWidgetScenario,
    parseWidgetDescription,
    widgetDescriptionFileName,
    widgetMocksDirName,
    widgetScenariosDirName,
    widgetSourceDirName,
    widgetTestingDirName,
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

    const widget = parseWidgetDescription(widgetName, await file.json().catch(() => null))
    const defaultSourcePath = join(resolveWidgetDirPath(projectPath, widgetName), widgetSourceDirName)

    if (widget.source === undefined && (await isDirectory(defaultSourcePath))) {
        widget.source = widgetSourceDirName
    }

    return widget
}

async function isDirectory(path: string): Promise<boolean> {
    return (await stat(path).catch(() => null))?.isDirectory() ?? false
}

function resolveWidgetTestingPath(projectPath: string, widgetName: string, dirName: string): string {
    return join(resolveWidgetDirPath(projectPath, widgetName), widgetTestingDirName, dirName)
}

/** Scenario names are the `.ts` files in `widgets/<name>/testing/scenarios/`, without the extension. */
export async function listWidgetScenarios(projectPath: string, widgetName: string): Promise<string[]> {
    const scenariosPath = resolveWidgetTestingPath(projectPath, widgetName, widgetScenariosDirName)
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
        resolveWidgetTestingPath(projectPath, widgetName, widgetScenariosDirName),
        `${toPathSegment(scenarioName)}.ts`
    )

    if (!(await Bun.file(scenarioPath).exists())) {
        throw new Error(`Scenario "${scenarioName}" of widget "${widgetName}" is not in ${scenarioPath}.`)
    }

    const module = await importWidgetModule(scenarioPath)
    const scenario = module.default as WidgetScenario | undefined

    if (!scenario || typeof scenario !== 'object') {
        throw new Error(
            `${scenarioPath} must export a scenario as default: export default defineWidgetScenario({ ... }).`
        )
    }

    return scenario
}

/** Imports `widgets/<name>/testing/mocks/<mocksName>.ts` afresh, like a scenario. */
export async function loadWidgetMocks(projectPath: string, widgetName: string, mocksName: string): Promise<WidgetMocks> {
    const mocksPath = join(
        resolveWidgetTestingPath(projectPath, widgetName, widgetMocksDirName),
        `${toPathSegment(mocksName)}.ts`
    )

    if (!(await Bun.file(mocksPath).exists())) {
        throw new Error(`Mocks "${mocksName}" of widget "${widgetName}" are not in ${mocksPath}.`)
    }

    const mocks = (await importWidgetModule(mocksPath)).default as WidgetMocks | undefined

    if (!mocks || typeof mocks !== 'object') {
        throw new Error(`${mocksPath} must export mocks as default: export default defineWidgetMocks({ ... }).`)
    }

    return mocks
}

const widgetSubpath = '@zoho-studio/zoho-crm/widget'
let widgetSubpathProvided = false

/**
 * The compiled `zoho-studio` cannot resolve the project's `node_modules` for a file it imports at
 * run time, so a scenario's `import { defineWidgetScenario } from '@zoho-studio/zoho-crm/widget'`
 * fails there. Those functions only return their argument, so the binary provides them itself.
 */
async function importWidgetModule(modulePath: string): Promise<{ default?: unknown }> {
    try {
        return await import(`${modulePath}?at=${Date.now()}`)
    } catch (error) {
        if (widgetSubpathProvided || !String(error).includes(`Cannot find module '${widgetSubpath}'`)) {
            throw error
        }

        plugin({
            name: 'zoho-studio-widget-scenario',
            setup(build) {
                build.module(widgetSubpath, () => ({ exports: { defineWidgetMocks, defineWidgetScenario }, loader: 'object' }))
            },
        })
        widgetSubpathProvided = true

        // A failed import stays cached under its specifier, so the retry asks for a new one.
        return import(`${modulePath}?at=${Date.now()}-retry`)
    }
}
