import { Command } from 'commander'
import { loadConfig } from 'bunfig'
import {resolve} from 'path'

export const initCommand = new Command('test')
    .description('Test')
    .action(async () => {
        const test = await loadConfig({
            name: 'test2',
            cwd: resolve('.zoho-studio'),
            defaultConfig: {}
        })

        console.log(test);
    })
