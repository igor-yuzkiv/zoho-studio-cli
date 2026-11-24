import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { WidgetLocation } from '../widget.types'
import {
    parseWidgetDescription,
    widgetDescriptionFileName,
    widgetFixturesDirName,
    widgetScenariosDirName,
} from '../widget.utils'
import { resolveWidgetDirPath } from './local-widgets.service'

export interface ScaffoldWidgetOptions {
    name: string
    url: string
    location?: WidgetLocation
    module?: string
}

/** Every file `z-crm:widgets:make` creates, keyed by its path relative to the project. */
export type ScaffoldedWidgetFiles = string[]

const playwrightConfigFileName = 'playwright.config.ts'

/**
 * Lays out a widget folder that runs as is: a description, a scenario that opens one record, a
 * fixture with that record, and a Playwright test. Refuses a name that is already taken.
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
    })
    const widgetDir = resolveWidgetDirPath(projectPath, description.name)

    if (await Bun.file(join(widgetDir, widgetDescriptionFileName)).exists()) {
        throw new Error(`Widget "${description.name}" already exists in widgets/${description.name}.`)
    }

    const files: Record<string, string> = {
        [`widgets/${description.name}/${widgetDescriptionFileName}`]: `${JSON.stringify(
            { url: description.url, location: description.location, defaultScenario: description.defaultScenario },
            null,
            4
        )}\n`,
        [`widgets/${description.name}/${widgetScenariosDirName}/default.ts`]: scenarioTemplate(moduleName),
        [`widgets/${description.name}/${widgetFixturesDirName}/${moduleName}.json`]: `${JSON.stringify(
            [{ id: '1000000000001', Full_Name: 'Sample Record' }],
            null,
            4
        )}\n`,
        [`widgets/${description.name}/tests/${description.name}.spec.ts`]: testTemplate(description.name),
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

export default defineWidgetScenario({
    pageLoad: { Entity: '${moduleName}', EntityId: '1000000000001' },
    mocks: {
        // 'API.updateRecord': ({ Entity, APIData }) => ({ data: [{ code: 'SUCCESS', details: { id: APIData.id } }] }),
    },
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
    testMatch: '**/tests/**/*.spec.ts',
    reporter: [['list'], ['html', { outputFolder: 'widgets/.report', open: 'never' }]],
    webServer: {
        command: 'zoho-studio z-crm:widgets:serve --port=4610',
        url: 'http://127.0.0.1:4610/api/widgets',
        reuseExistingServer: true,
    },
})
`
