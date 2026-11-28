import { Command } from 'commander'

import { getProjectSettings } from '@zoho-studio/core'
import { scaffoldWidget, type WidgetLocation } from '@zoho-studio/zoho-crm/widget'

export const makeWidgetCommand = new Command('z-crm:widgets:make')
    .description('Create widgets/<name>/ with a description, a scenario, mocks and a Playwright test')
    .requiredOption('-n, --name <name>', 'Folder name of the widget')
    .requiredOption('-u, --url <url>', 'Address the widget already runs at, e.g. http://127.0.0.1:5000/app/widget.html')
    .option('-l, --location <type>', 'Where Zoho CRM shows it, e.g. "Custom Button"')
    .option('-m, --module <api_name>', 'Module of the sample record', 'Leads')
    .option('-s, --source <path>', "Where the widget's code is, relative to the widget folder or absolute (default: src)")
    .option('-r, --run <command>', 'Shell command that starts the widget, so the emulator starts it when needed')
    .action(
        async (options: {
            name: string
            url: string
            location?: WidgetLocation
            module: string
            source?: string
            run?: string
        }) => {
            const { projectPath } = await getProjectSettings()
            const files = await scaffoldWidget(projectPath, options)

            for (const file of files) {
                console.log(`Created ${file}`)
            }
        }
    )
