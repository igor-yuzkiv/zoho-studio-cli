import { join } from 'node:path'

import { Command } from 'commander'
import open from 'open'

import { getProjectSettings } from '@/settings'

import { startBrowserServer } from './browser-server.service'

// The built page sits in dist/web at the repository root; the compiled binary embeds it instead.
const webAssetsPath = join(import.meta.dir, '../../../../dist/web')

export const browserCommand = new Command('browser')
    .description('Open the project in a local web app to browse its artifacts and run pulls')
    .option('--port <number>', 'Port to listen on; a free one is picked when omitted', '0')
    .option('--no-open', 'Start the server without opening a browser')
    .action(async (options: { port: string; open: boolean }) => {
        const { projectPath } = await getProjectSettings()
        const server = startBrowserServer({ projectPath, port: Number(options.port), webAssetsPath })
        const url = `http://127.0.0.1:${server.port}/`

        console.log(`Zoho Studio is running at ${url}`)
        console.log('Press Ctrl+C to stop.')

        if (options.open) {
            await open(url)
        }
    })
