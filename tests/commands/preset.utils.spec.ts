import { describe, expect, test } from 'bun:test'

import { splitPresetEntry } from '@/commands/preset/preset.utils'

describe('splitPresetEntry', () => {
    test('splits a command line on whitespace', () => {
        expect(splitPresetEntry('z-crm:fields:pull  --module=Leads')).toEqual(['z-crm:fields:pull', '--module=Leads'])
    })

    test('keeps a quoted value with spaces as one argument', () => {
        expect(splitPresetEntry(`z-crm:workflows:pull --module "Sales Orders" -x 'a b'`)).toEqual([
            'z-crm:workflows:pull',
            '--module',
            'Sales Orders',
            '-x',
            'a b',
        ])
    })

    test('returns nothing for a blank entry', () => {
        expect(splitPresetEntry('   ')).toEqual([])
    })
})
