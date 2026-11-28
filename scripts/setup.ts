/**
 * Installs the CLI from this clone, or updates it after a "git pull": builds the executable, links
 * it into a folder on PATH, and registers the packages for project scripts. Safe to run again.
 */
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import { assertSupportedPlatform, executableName, installExecutableLink, isOnPath, pathHint } from './setup.utils'

const rootPath = join(import.meta.dir, '..')
const home = homedir()

const { values: options } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
        force: { type: 'boolean', default: false },
        'bin-dir': { type: 'string', default: join(home, '.local/bin') },
        help: { type: 'boolean', short: 'h', default: false },
    },
})

if (options.help) {
    console.log(
        [
            'Usage: bun run setup [--bin-dir <path>] [--force]',
            '',
            'Builds zoho-studio from this clone and links it into a folder on PATH.',
            '  --bin-dir <path>  where to put the zoho-studio link (default: ~/.local/bin)',
            '  --force           replace whatever already is at <bin-dir>/zoho-studio',
        ].join('\n')
    )
    process.exit(0)
}

function runStep(title: string, command: string[], { quiet = false } = {}): void {
    console.log(`\n→ ${title}`)
    const output = quiet ? 'pipe' : 'inherit'
    const result = Bun.spawnSync(command, { cwd: rootPath, stdout: output, stderr: output })

    if (result.exitCode !== 0) {
        if (quiet) {
            process.stdout.write(result.stdout?.toString() ?? '')
            process.stderr.write(result.stderr?.toString() ?? '')
        }

        throw new Error(`"${command.join(' ')}" failed with exit code ${result.exitCode}.`)
    }
}

try {
    assertSupportedPlatform(process.platform)

    const binPath = resolve(options['bin-dir'].replace(/^~(?=\/|$)/, home))
    const executablePath = join(rootPath, 'dist', executableName)

    runStep('Installing dependencies', ['bun', 'install'])
    runStep('Building the executable', ['bun', 'run', 'compile'])

    console.log(`\n→ Linking ${executableName} into ${binPath}`)
    const link = await installExecutableLink({ binPath, targetPath: executablePath, force: options.force })
    const linkMessages = { created: 'created', unchanged: 'already in place', replaced: 'replaced' }
    console.log(`${link.linkPath} → ${executablePath}: ${linkMessages[link.status]}`)

    // bun link prints a "how to use it in a project" hint per package; init already sets that up.
    runStep('Registering the packages for project scripts', ['bun', 'run', 'link'], { quiet: true })

    const versionRun = Bun.spawnSync([link.linkPath, '--version'])

    if (versionRun.exitCode !== 0) {
        throw new Error(`the installed ${link.linkPath} does not run: "--version" exited with code ${versionRun.exitCode}.`)
    }

    const version = versionRun.stdout.toString().trim()
    console.log(`\nzoho-studio ${version} is installed.`)

    if (!isOnPath(binPath, process.env.PATH, home)) {
        console.log(`\n${pathHint({ binPath, home, shell: process.env.SHELL, platform: process.platform })}`)
    }
} catch (error) {
    console.error(`\nSetup stopped: ${error instanceof Error ? error.message : error}`)
    process.exit(1)
}
