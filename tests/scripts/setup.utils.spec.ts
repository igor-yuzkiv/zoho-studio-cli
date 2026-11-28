import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { lstat, mkdtemp, readlink, rm, symlink, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
    assertSupportedPlatform,
    installExecutableLink,
    isOnPath,
    pathHint,
} from '../../scripts/setup.utils'

let workPath: string
let targetPath: string
let binPath: string

beforeEach(async () => {
    workPath = await mkdtemp(join(tmpdir(), 'zoho-studio-setup-'))
    targetPath = join(workPath, 'clone/dist/zoho-studio')
    binPath = join(workPath, 'bin')
    await mkdir(join(workPath, 'clone/dist'), { recursive: true })
    await writeFile(targetPath, '#!/bin/sh\n')
})

afterEach(async () => {
    await rm(workPath, { recursive: true, force: true })
})

describe('installExecutableLink', () => {
    test('creates the folder and the link when neither exists', async () => {
        const result = await installExecutableLink({ binPath, targetPath, force: false })

        expect(result).toEqual({ status: 'created', linkPath: join(binPath, 'zoho-studio') })
        expect(await readlink(join(binPath, 'zoho-studio'))).toBe(targetPath)
    })

    test('leaves a link that already points at the target', async () => {
        await installExecutableLink({ binPath, targetPath, force: false })

        const result = await installExecutableLink({ binPath, targetPath, force: false })

        expect(result.status).toBe('unchanged')
    })

    test('refuses a link to another clone and names it', async () => {
        await mkdir(binPath)
        await symlink('/elsewhere/dist/zoho-studio', join(binPath, 'zoho-studio'))

        expect(installExecutableLink({ binPath, targetPath, force: false })).rejects.toThrow(
            /points at \/elsewhere\/dist\/zoho-studio.*--force/s
        )
    })

    test('refuses a regular file in place of the link', async () => {
        await mkdir(binPath)
        await writeFile(join(binPath, 'zoho-studio'), 'something else')

        expect(installExecutableLink({ binPath, targetPath, force: false })).rejects.toThrow(/is a file.*--force/s)
    })

    test('replaces another link or a file with --force', async () => {
        await mkdir(binPath)
        await writeFile(join(binPath, 'zoho-studio'), 'something else')

        const result = await installExecutableLink({ binPath, targetPath, force: true })

        expect(result.status).toBe('replaced')
        expect((await lstat(join(binPath, 'zoho-studio'))).isSymbolicLink()).toBe(true)
        expect(await readlink(join(binPath, 'zoho-studio'))).toBe(targetPath)
    })

    test('refuses a folder in place of the link even with --force', async () => {
        await mkdir(join(binPath, 'zoho-studio'), { recursive: true })

        expect(installExecutableLink({ binPath, targetPath, force: true })).rejects.toThrow(/is a folder/)
    })
})

describe('isOnPath', () => {
    test('finds the folder among the PATH entries, ignoring a trailing slash', () => {
        expect(isOnPath('/home/me/.local/bin', '/usr/bin:/home/me/.local/bin/:/bin', '/home/me')).toBe(true)
    })

    test('expands ~ and $HOME in PATH entries', () => {
        expect(isOnPath('/home/me/.local/bin', '~/.local/bin:/bin', '/home/me')).toBe(true)
        expect(isOnPath('/home/me/.local/bin', '$HOME/.local/bin', '/home/me')).toBe(true)
    })

    test('is false when the folder is not there', () => {
        expect(isOnPath('/home/me/.local/bin', '/usr/bin:/bin', '/home/me')).toBe(false)
        expect(isOnPath('/home/me/.local/bin', undefined, '/home/me')).toBe(false)
    })
})

describe('pathHint', () => {
    const binPath = '/home/me/.local/bin'
    const home = '/home/me'

    test('zsh — a line for ~/.zshrc', () => {
        expect(pathHint({ binPath, home, shell: '/bin/zsh', platform: 'darwin' })).toContain(
            `echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc`
        )
    })

    test('bash on macOS — ~/.bash_profile, on Linux — ~/.bashrc', () => {
        expect(pathHint({ binPath, home, shell: '/bin/bash', platform: 'darwin' })).toContain('~/.bash_profile')
        expect(pathHint({ binPath, home, shell: '/usr/bin/bash', platform: 'linux' })).toContain('~/.bashrc')
    })

    test('fish — fish_add_path', () => {
        expect(pathHint({ binPath, home, shell: '/usr/bin/fish', platform: 'linux' })).toContain(
            'fish_add_path $HOME/.local/bin'
        )
    })

    test('an unknown shell — a generic export line', () => {
        const hint = pathHint({ binPath, home, shell: undefined, platform: 'darwin' })

        expect(hint).toContain('export PATH="$HOME/.local/bin:$PATH"')
        expect(hint).not.toContain('>>')
    })

    test('Linux adds that logging in again may be enough', () => {
        expect(pathHint({ binPath, home, shell: '/bin/zsh', platform: 'linux' })).toContain('logging in again')
        expect(pathHint({ binPath, home, shell: '/bin/zsh', platform: 'darwin' })).not.toContain('logging in again')
    })

    test('a folder outside home is written as it is', () => {
        expect(pathHint({ binPath: '/opt/bin', home, shell: '/bin/zsh', platform: 'darwin' })).toContain(
            'export PATH="/opt/bin:$PATH"'
        )
    })
})

describe('assertSupportedPlatform', () => {
    test('accepts macOS and Linux', () => {
        expect(() => assertSupportedPlatform('darwin')).not.toThrow()
        expect(() => assertSupportedPlatform('linux')).not.toThrow()
    })

    test('refuses Windows with an explanation', () => {
        expect(() => assertSupportedPlatform('win32')).toThrow(/Windows is not supported/)
    })
})
