import { Command } from 'commander'
import cliProgress from 'cli-progress'


export const debugCommand = new Command('debug').description('debug').action(async () => {
    console.log('Debug')

    const bar = new cliProgress.SingleBar(
        {
            format: 'Pulling functions |{bar}| {value}/{total} | {name}',
            hideCursor: true,
            clearOnComplete: false,
        },
        cliProgress.Presets.shades_classic
    )


    bar.start(10, 0, {
        name: 'Starting...',
    })


    bar.update({
        name: "test 1",
    })
    bar.increment()

    bar.update({
        name: 'test 1',
    })
    bar.increment()
})
