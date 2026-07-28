import { describe, expect, test } from 'bun:test'

import { resolveCodeFileName } from '@/commands/functions/pull-functions.command'

describe('resolveCodeFileName', () => {
    test('appends the configured extension to the function name', () => {
        expect(resolveCodeFileName('Calculate Invoice Total', 'deluge')).toBe('Calculate Invoice Total.deluge')
        expect(resolveCodeFileName('Calculate Invoice Total', 'dg')).toBe('Calculate Invoice Total.dg')
    })

    test('accepts an extension written with a leading dot', () => {
        expect(resolveCodeFileName('Send Invoice', '.deluge')).toBe('Send Invoice.deluge')
    })

    test('leaves the name bare when no extension is configured', () => {
        expect(resolveCodeFileName('Send Invoice', '')).toBe('Send Invoice')
        expect(resolveCodeFileName('Send Invoice', '.')).toBe('Send Invoice')
    })

    test('keeps the file name a single path segment', () => {
        expect(resolveCodeFileName('reports/monthly', 'deluge')).toBe('reports_monthly.deluge')
        expect(resolveCodeFileName('Send Invoice', 'deluge/js')).toBe('Send Invoice.deluge_js')
    })
})
