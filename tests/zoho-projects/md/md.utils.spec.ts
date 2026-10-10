import { describe, expect, test } from 'bun:test'

import { resolveMdPath, toDisplayName, toSlug } from '@zoho-studio/zoho-projects'

describe('toSlug', () => {
    test('lower-cases, dashes and cuts a name', () => {
        expect(toSlug('Phase 22: Technical &amp; Platform Updates')).toBe('phase-22-technical-platform-updates')
        expect(toSlug(`${'word '.repeat(30)}`)).toHaveLength(79)
    })

    test('keeps the fixed _no-* folder names', () => {
        expect(toSlug('_no-milestone')).toBe('_no-milestone')
    })

    test('falls back to the id when nothing is left of the name', () => {
        expect(toSlug('???', '42')).toBe('42')
    })
})

describe('toDisplayName', () => {
    test('replaces the characters Obsidian and the file system refuse', () => {
        expect(toDisplayName('Bugs | [Admin] Pilot')).toBe('Bugs - -Admin - Pilot')
        expect(toDisplayName('a/b\\c:d')).toBe('a -b -c -d')
    })
})

describe('resolveMdPath', () => {
    test('defaults to src/zoho-projects/md inside the workspace', () => {
        expect(resolveMdPath('/ws', '')).toBe('/ws/src/zoho-projects/md')
    })

    test('takes an absolute path, or one relative to the workspace root', () => {
        expect(resolveMdPath('/ws', '/vault/zoho')).toBe('/vault/zoho')
        expect(resolveMdPath('/ws', 'notes/zoho')).toBe('/ws/notes/zoho')
        expect(resolveMdPath('/ws', '../vault')).toBe('/vault')
    })
})
