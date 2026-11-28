import { lstat, mkdir, readlink, rm, symlink } from 'node:fs/promises'
import { join, resolve } from 'node:path'

export const executableName = 'zoho-studio'

export type LinkStatus = 'created' | 'unchanged' | 'replaced'

export interface LinkResult {
    status: LinkStatus
    linkPath: string
}

export function assertSupportedPlatform(platform: NodeJS.Platform): void {
    if (platform === 'win32') {
        throw new Error('Windows is not supported yet: setup installs the CLI on macOS and Linux only.')
    }
}

/**
 * Puts `<binPath>/zoho-studio` as a link to the built executable. A link that is already right is
 * left alone, so setup can run again; anything else in its place is somebody's file and is
 * replaced only on `force`.
 */
export async function installExecutableLink({
    binPath,
    targetPath,
    force,
}: {
    binPath: string
    targetPath: string
    force: boolean
}): Promise<LinkResult> {
    const linkPath = join(binPath, executableName)
    const existing = await lstat(linkPath).catch(() => null)

    if (!existing) {
        await mkdir(binPath, { recursive: true })
        await symlink(targetPath, linkPath)

        return { status: 'created', linkPath }
    }

    if (existing.isDirectory()) {
        throw new Error(`${linkPath} is a folder; remove it and run setup again.`)
    }

    if (existing.isSymbolicLink()) {
        const currentTarget = await readlink(linkPath)

        if (resolve(binPath, currentTarget) === resolve(targetPath)) {
            return { status: 'unchanged', linkPath }
        }

        if (!force) {
            throw new Error(
                `${linkPath} points at ${currentTarget}, not at this clone (${targetPath}).\n` +
                    'Run "bun run setup --force" to point it here, or "--bin-dir <path>" to install elsewhere.'
            )
        }
    } else if (!force) {
        throw new Error(
            `${linkPath} is a file, not a link to zoho-studio.\n` +
                'Run "bun run setup --force" to replace it, or "--bin-dir <path>" to install elsewhere.'
        )
    }

    await rm(linkPath)
    await symlink(targetPath, linkPath)

    return { status: 'replaced', linkPath }
}

export function isOnPath(binPath: string, pathVariable: string | undefined, home: string): boolean {
    const wanted = withoutTrailingSlash(binPath)

    return (pathVariable ?? '')
        .split(':')
        .filter((entry) => entry.length > 0)
        .map((entry) => withoutTrailingSlash(expandHome(entry, home)))
        .includes(wanted)
}

/** What to run so a new shell finds the folder; it depends on the shell, not on the system. */
export function pathHint({
    binPath,
    home,
    shell,
    platform,
}: {
    binPath: string
    home: string
    shell: string | undefined
    platform: NodeJS.Platform
}): string {
    const folder = binPath.startsWith(home + '/') ? '$HOME' + binPath.slice(home.length) : binPath
    const exportLine = `export PATH="${folder}:$PATH"`
    const shellName = shell?.split('/').pop()

    const command =
        shellName === 'zsh'
            ? `echo '${exportLine}' >> ~/.zshrc`
            : shellName === 'bash'
              ? `echo '${exportLine}' >> ${platform === 'darwin' ? '~/.bash_profile' : '~/.bashrc'}`
              : shellName === 'fish'
                ? `fish_add_path ${folder}`
                : exportLine

    const lines = [
        `${binPath} is not on your PATH, so the shell will not find zoho-studio yet. Add it:`,
        '',
        `    ${command}`,
        '',
        'then open a new terminal.',
    ]

    if (platform === 'linux') {
        lines.push('Many Linux systems add ~/.local/bin to PATH at login once it exists, so logging in again may be enough.')
    }

    return lines.join('\n')
}

function expandHome(entry: string, home: string): string {
    if (entry === '~' || entry === '$HOME') {
        return home
    }

    for (const prefix of ['~/', '$HOME/']) {
        if (entry.startsWith(prefix)) {
            return join(home, entry.slice(prefix.length))
        }
    }

    return entry
}

function withoutTrailingSlash(path: string): string {
    return path.length > 1 ? path.replace(/\/+$/, '') : path
}
