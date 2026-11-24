import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { FrameLocator, Page, TestInfo, TestType } from '@playwright/test'

// Playwright runs this file in Node, not Bun: it may import only node: modules and types.

/** Where `z-crm:widgets:serve` listens unless told otherwise; the Playwright config starts it there. */
export const defaultWidgetEmulatorUrl = 'http://127.0.0.1:4610'

export interface WidgetCallRecord {
    at: string
    method: string
    args: Record<string, unknown>
    ok: boolean
    response?: unknown
    error?: unknown
}

export interface WidgetPage {
    /** Opens the widget in a fresh emulator session, so its call log is its own. */
    open(options: { widget: string; scenario?: string }): Promise<void>
    /** The widget itself, inside the harness page. */
    readonly frame: FrameLocator
    calls(): Promise<WidgetCallRecord[]>
    waitForCall(method: string, options?: { timeout?: number }): Promise<WidgetCallRecord>
    emit(name: string, data?: unknown): Promise<void>
    screenshot(name: string): Promise<string>
    readonly resultsDir: string
}

export interface WidgetFixtureOptions {
    emulatorUrl?: string
    projectPath?: string
}

/**
 * Adds `widgetPage` to the project's own Playwright `test`. Taking `test` as an argument keeps
 * Playwright out of this package: a linked package importing it would load a second copy.
 */
export function createWidgetFixtures<TArgs extends { page: Page }, TWorker extends object>(
    test: TestType<TArgs, TWorker>,
    options: WidgetFixtureOptions = {}
): TestType<TArgs & { widgetPage: WidgetPage }, TWorker> {
    const emulatorUrl = (
        options.emulatorUrl ??
        process.env.ZOHO_STUDIO_WIDGETS_URL ??
        defaultWidgetEmulatorUrl
    ).replace(/\/$/, '')
    const projectPath = options.projectPath ?? process.cwd()

    return test.extend<{ widgetPage: WidgetPage }>({
        widgetPage: async ({ page }: { page: Page }, use: (value: WidgetPage) => Promise<void>, testInfo: TestInfo) => {
            const widgetPage = createWidgetPage(page, testInfo, emulatorUrl, projectPath)
            await use(widgetPage)
            await widgetPage.finish()
        },
    } as never) as unknown as TestType<TArgs & { widgetPage: WidgetPage }, TWorker>
}

function createWidgetPage(page: Page, testInfo: TestInfo, emulatorUrl: string, projectPath: string) {
    let session: { id: string; widget: string; url: string } | null = null
    let resultsDir = ''

    const requireSession = () => {
        if (!session) throw new Error('Call widgetPage.open({ widget }) first.')
        return session
    }

    const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
        const response = await fetch(`${emulatorUrl}${path}`, init).catch((error) => {
            throw new Error(
                `Zoho Studio widget emulator is not reachable at ${emulatorUrl} (${error.message}). ` +
                    'Start it with "zoho-studio z-crm:widgets:serve" or through webServer in playwright.config.ts.'
            )
        })
        const text = await response.text()
        const body = text ? JSON.parse(text) : null

        if (!response.ok) throw new Error(body?.error ?? `Emulator answered ${response.status}`)

        return body as T
    }

    const widgetPage = {
        get frame() {
            return page.frameLocator('#widget')
        },
        get resultsDir() {
            return resultsDir
        },
        async open({ widget, scenario }: { widget: string; scenario?: string }) {
            session = await api('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ widget, scenario }),
            })
            resultsDir = join(projectPath, 'widgets', widget, 'results', toRunName(testInfo))
            await page.goto(session!.url)
            await page.waitForFunction(
                'window.__zohoStudio && (window.__zohoStudio.ready || window.__zohoStudio.error)',
                undefined,
                { timeout: 15_000 }
            )

            const error = await page.evaluate<string | null>('window.__zohoStudio.error')
            if (error) throw new Error(error)
        },
        calls: () => api<WidgetCallRecord[]>(`/api/sessions/${requireSession().id}/calls`),
        async waitForCall(method: string, { timeout = 5_000 } = {}) {
            const deadline = Date.now() + timeout

            while (Date.now() < deadline) {
                const call = (await widgetPage.calls()).find((item) => item.method === method)
                if (call) return call
                await new Promise((resolve) => setTimeout(resolve, 100))
            }

            throw new Error(`The widget did not call ${method} within ${timeout} ms.`)
        },
        async emit(name: string, data?: unknown) {
            await api(`/api/sessions/${requireSession().id}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, data }),
            })
        },
        async screenshot(name: string) {
            requireSession()
            const path = join(resultsDir, `${name}.png`)
            await page.screenshot({ path, fullPage: true })
            return path
        },
        async finish() {
            if (!session) return

            await mkdir(resultsDir, { recursive: true })
            await writeFile(join(resultsDir, 'calls.json'), `${JSON.stringify(await widgetPage.calls(), null, 4)}\n`)
            await page.screenshot({ path: join(resultsDir, 'final.png'), fullPage: true }).catch(() => {})
            await fetch(`${emulatorUrl}/api/sessions/${session.id}`, { method: 'DELETE' }).catch(() => {})
            session = null
        },
    }

    return widgetPage
}

function toRunName(testInfo: TestInfo): string {
    return (
        testInfo.titlePath
            .slice(1)
            .join(' ')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'run'
    )
}
