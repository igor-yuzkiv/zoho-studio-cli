import { Command } from 'commander'

import { getProjectSettings } from '@zoho-studio/core'
import { startWidgetEmulator } from '@zoho-studio/zoho-crm/widget'

export const serveWidgetsCommand = new Command('z-crm:widgets:serve')
    .description('Run widgets with an emulated Zoho CRM around them: mocked SDK answers, a call log per session')
    .option('-w, --widget <name>', 'Open a session for this widget and print its address')
    .option('-s, --scenario <name>', "Scenario of that session (default: the widget's defaultScenario)")
    .option('-p, --port <number>', 'Port to listen on', '4610')
    .action(async (options: { widget?: string; scenario?: string; port: string }) => {
        const { projectPath } = await getProjectSettings()
        const emulator = startWidgetEmulator({ projectPath, port: Number(options.port) })

        console.log(`Widget emulator: ${emulator.origin}`)

        if (options.widget) {
            const session = await emulator.createSession(options.widget, options.scenario)
            console.log(`Open ${session.widget}${session.scenario ? ` (${session.scenario})` : ''}: ${session.url}`)
        }

        console.log('Press Ctrl+C to stop.')

        // Playwright stops its webServer with SIGTERM; either way the widgets started by `run` stop too.
        for (const signal of ['SIGINT', 'SIGTERM'] as const) {
            process.once(signal, async () => {
                await emulator.stop()
                process.exit(0)
            })
        }
    })
