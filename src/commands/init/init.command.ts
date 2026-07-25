import { Command } from 'commander'

export const initCommand = new Command('init')
    .action(async () => { 
        console.log('init command')
    })
