/**
 * Builds the standalone executable with the web page inside it. `bun build --compile` embeds a file
 * only when the code imports it, and the page's file names carry content hashes, so a throwaway
 * entry point imports every file of dist/web and registers them before the CLI starts.
 */
import { mkdir, rm } from 'node:fs/promises'
import { join, relative } from 'node:path'

const rootPath = join(import.meta.dir, '..')
const webPath = join(rootPath, 'dist/web')
const entryDirPath = join(rootPath, '.build')
const entryPath = join(entryDirPath, 'compile.entry.ts')

const webFiles = (await Array.fromAsync(new Bun.Glob('**/*').scan({ cwd: webPath, onlyFiles: true }))).sort()

if (!webFiles.includes('index.html')) {
    throw new Error('dist/web has no index.html; run "bun run build:web" first.')
}

const importPath = (filePath: string) => relative(entryDirPath, join(webPath, filePath))

const entrySource = [
    "import { registerEmbeddedWebAssets } from '../src/cli/commands/browser/web-assets.service'",
    ...webFiles.map(
        (filePath, index) => `import asset${index} from ${JSON.stringify(importPath(filePath))} with { type: 'file' }`
    ),
    '',
    'registerEmbeddedWebAssets({',
    ...webFiles.map((filePath, index) => `    ${JSON.stringify(filePath)}: asset${index},`),
    '})',
    '',
    "await import('../src/cli/index')",
    '',
].join('\n')

await mkdir(entryDirPath, { recursive: true })
await Bun.write(entryPath, entrySource)

let buildExitCode: number

try {
    const build = Bun.spawnSync(
        ['bun', 'build', entryPath, '--compile', '--outfile', join(rootPath, 'dist/zoho-studio')],
        {
            stdout: 'inherit',
            stderr: 'inherit',
        }
    )

    buildExitCode = build.exitCode
} finally {
    await rm(entryDirPath, { recursive: true, force: true })
}

if (buildExitCode !== 0) {
    process.exit(buildExitCode)
}

console.log(`Embedded ${webFiles.length} web files.`)
