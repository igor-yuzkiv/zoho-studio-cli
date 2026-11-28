import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { WidgetLocation } from '../widget.types'
import {
    parseWidgetDescription,
    widgetDescriptionFileName,
    widgetMocksDirName,
    widgetScenariosDirName,
    widgetTestingDirName,
    widgetTestsDirName,
} from '../widget.utils'
import { resolveWidgetDirPath } from './local-widgets.service'

export interface ScaffoldWidgetOptions {
    name: string
    url: string
    location?: WidgetLocation
    module?: string
    source?: string
    /** The shell command that starts the widget, stored as `run.command`. */
    run?: string
}

/** Every file `z-crm:widgets:make` creates, keyed by its path relative to the project. */
export type ScaffoldedWidgetFiles = string[]

const playwrightConfigFileName = 'playwright.config.ts'

/**
 * Lays out a widget folder that runs as is: a description, a scenario that opens one record and
 * mocks reading it, and a Playwright test. Refuses a name that is already taken.
 */
export async function scaffoldWidget(
    projectPath: string,
    options: ScaffoldWidgetOptions
): Promise<ScaffoldedWidgetFiles> {
    const moduleName = options.module ?? 'Leads'
    const description = parseWidgetDescription(options.name, {
        url: options.url,
        location: options.location,
        defaultScenario: 'default',
        source: options.source,
        run: options.run ? { command: options.run } : undefined,
    })
    const widgetDir = resolveWidgetDirPath(projectPath, description.name)

    if (await Bun.file(join(widgetDir, widgetDescriptionFileName)).exists()) {
        throw new Error(`Widget "${description.name}" already exists in widgets/${description.name}.`)
    }

    const testingDir = `widgets/${description.name}/${widgetTestingDirName}`
    const files: Record<string, string> = {
        [`widgets/${description.name}/${widgetDescriptionFileName}`]: `${JSON.stringify(
            {
                url: description.url,
                location: description.location,
                defaultScenario: description.defaultScenario,
                source: description.source,
                run: description.run,
            },
            null,
            4
        )}\n`,
        [`${testingDir}/${widgetScenariosDirName}/default.ts`]: scenarioTemplate(moduleName),
        [`${testingDir}/${widgetMocksDirName}/record.ts`]: recordMocksTemplate(),
        [`${testingDir}/${widgetTestsDirName}/${description.name}.spec.ts`]: testTemplate(description.name),
    }

    if (!(await Bun.file(join(projectPath, playwrightConfigFileName)).exists())) {
        files[playwrightConfigFileName] = playwrightConfigTemplate
    }

    for (const [relativePath, content] of Object.entries(files)) {
        const filePath = join(projectPath, relativePath)
        await mkdir(join(filePath, '..'), { recursive: true })
        await writeFile(filePath, content)
    }

    return Object.keys(files)
}

function scenarioTemplate(moduleName: string): string {
    return `import { defineWidgetScenario } from '@zoho-studio/zoho-crm/widget'

// A situation: the record the widget opens on, and which files of testing/mocks/ answer the SDK.
export default defineWidgetScenario({
    pageLoad: { Entity: '${moduleName}', EntityId: '1000000000001' },
    use: ['record'],
    mocks: {
        // Mocks of this scenario only; they replace those of the files in use.
    },
})
`
}

function recordMocksTemplate(): string {
    return `import { defineWidgetMocks } from '@zoho-studio/zoho-crm/widget'

// Answers of SDK methods, shared by scenarios (use: ['record']) and tests (widgetPage.open({ use: ['record'] })).
export default defineWidgetMocks({
    'API.getRecord': { data: [{ id: '1000000000001' }] },
    // 'API.updateRecord': ({ APIData }) => ({ data: [{ code: 'SUCCESS', details: { id: APIData.id } }] }),
})
`
}

function testTemplate(widgetName: string): string {
    return `import { test as base, expect } from '@playwright/test'
import { createWidgetFixtures } from '@zoho-studio/zoho-crm/widget-testing'

const test = createWidgetFixtures(base)

test('${widgetName} opens on a record', async ({ widgetPage }) => {
    await widgetPage.open({ widget: '${widgetName}', scenario: 'default' })

    await expect(widgetPage.frame.locator('body')).toBeVisible()
    await widgetPage.screenshot('opened')
})
`
}

const playwrightConfigTemplate = `import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: 'widgets',
    testMatch: '**/testing/tests/**/*.spec.ts',
    reporter: [['list'], ['html', { outputFolder: 'widgets/.report', open: 'never' }]],
    webServer: {
        command: 'zoho-studio z-crm:widgets:serve --port=4610',
        url: 'http://127.0.0.1:4610/api/widgets',
        reuseExistingServer: true,
        // SIGTERM lets the emulator stop the widgets it started with their run command.
        gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
    },
})
`
