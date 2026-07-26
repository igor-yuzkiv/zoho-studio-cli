import { Command } from 'commander'

export const debugCommand = new Command('debug').description('debug').action(async () => {
    console.log('Debug')
})
