import { describe, expect, test } from 'bun:test'

import {
    resolvePageDirSegments,
    resolveScriptSourceSegments,
    type ClientScriptPage,
} from '@/zoho-crm/entities/client-script'

const programs = { api_name: 'CustomModule3', display_label: 'Programs' }

describe('resolvePageDirSegments', () => {
    test('names a page after its module label, definition and layout', () => {
        const page: ClientScriptPage = {
            id: '1',
            definition: 'module_create',
            selectors: { module: programs, layout: { api_name: 'Weekend_Awareness' } },
        }

        expect(resolvePageDirSegments([page]).get('1')).toEqual([
            'zoho-crm',
            'client-scripts',
            'Programs',
            'module_create.Weekend_Awareness',
        ])
    })

    test('adds the canvas name to a canvas page', () => {
        const page: ClientScriptPage = {
            id: '1',
            definition: 'module_view_canvas',
            selectors: {
                module: programs,
                layout: { api_name: 'Standard__s' },
                canvas: { name: 'Weekend Directions' },
            },
        }

        expect(resolvePageDirSegments([page]).get('1')?.at(-1)).toBe(
            'module_view_canvas.Standard__s.Weekend Directions'
        )
    })

    test('groups a page without a module under the no-module folder', () => {
        const page: ClientScriptPage = { id: '1', definition: 'commands' }

        expect(resolvePageDirSegments([page]).get('1')).toEqual([
            'zoho-crm',
            'client-scripts',
            '_no-module',
            'commands',
        ])
    })

    test('keeps two same-named pages apart by the id of the later one', () => {
        const pages: ClientScriptPage[] = [
            { id: '2', definition: 'commands' },
            { id: '1', definition: 'commands' },
        ]
        const segments = resolvePageDirSegments(pages)

        expect(segments.get('1')?.at(-1)).toBe('commands')
        expect(segments.get('2')?.at(-1)).toBe('commands.2')
    })
})

describe('resolveScriptSourceSegments', () => {
    test('places the source in a directory named after the script and its id', () => {
        expect(resolveScriptSourceSegments(['page'], { id: '42', name: 'Validate/Shifts' })).toEqual([
            'page',
            'Validate_Shifts.42',
            'Validate_Shifts.js',
        ])
    })
})
