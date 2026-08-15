import { Command } from 'commander'
import open from 'open'

export const browserCommand = new Command('browser').description('browser').action(async () => {
    console.log('browser')

    Bun.serve({
        routes: {
            "/browser": (req) => {
                console.log(req)
                return new  Response('Test')
            }
        }
    })

    open('http://localhost:3000/browser')
})
