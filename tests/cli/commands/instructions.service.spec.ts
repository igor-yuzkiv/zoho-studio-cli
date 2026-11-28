import { describe, expect, test } from 'bun:test'

import { listNamespaces, renderInstructions, type CommandSummary } from '@/commands/instructions/instructions.service'

const commands: CommandSummary[] = [
    { name: 'init', summary: 'Scaffold a project' },
    { name: 'z-crm:status', summary: 'Show the organization' },
    { name: 'z-crm:functions:pull', summary: 'Download functions' },
    { name: 'z-crm:functions:deploy', summary: 'Deploy a function' },
    { name: 'z-crm:fields:pull', summary: 'Download fields' },
]

const texts = {
    overview: '# zoho-studio\n\nThe overview.',
    init: '# init\n\nInit text.',
    'z-crm': '# z-crm\n\nThe CRM area.',
    'z-crm/functions': '# z-crm:functions\n\nThe functions group.',
    'z-crm/status': '# z-crm:status\n\nStatus text.',
    'z-crm/functions/pull': '# z-crm:functions:pull\n\nPull text.',
    'z-crm/functions/deploy': '# z-crm:functions:deploy\n\nDeploy text.',
    'z-crm/fields/pull': '# z-crm:fields:pull\n\nFields text.',
}

describe('renderInstructions', () => {
    test('without a name prints the overview and every command', () => {
        const output = renderInstructions(undefined, commands, texts)

        expect(output).toStartWith('# zoho-studio\n\nThe overview.')
        for (const command of commands) {
            expect(output).toContain(`- \`${command.name}\` — ${command.summary}`)
        }
    })

    test('a command prints its own text and points at --help', () => {
        const output = renderInstructions('z-crm:functions:pull', commands, texts)

        expect(output).toStartWith('# z-crm:functions:pull\n\nPull text.')
        expect(output).toContain('zoho-studio z-crm:functions:pull --help')
        expect(output).not.toContain('Deploy a function')
    })

    test('a group prints its text and only its own commands', () => {
        const output = renderInstructions('z-crm:functions', commands, texts)

        expect(output).toStartWith('# z-crm:functions\n\nThe functions group.')
        expect(output).toContain('`z-crm:functions:pull`')
        expect(output).toContain('`z-crm:functions:deploy`')
        expect(output).not.toContain('`z-crm:fields:pull`')
    })

    test('an area lists every command under it', () => {
        const output = renderInstructions('z-crm', commands, texts)

        expect(output).toStartWith('# z-crm\n\nThe CRM area.')
        expect(output).toContain('`z-crm:status`')
        expect(output).toContain('`z-crm:fields:pull`')
        expect(output).not.toContain('`init`')
    })

    test('a group without a text of its own gets a heading and its command list', () => {
        const output = renderInstructions('z-crm:fields', commands, texts)

        expect(output).toStartWith('# z-crm:fields\n\n## Commands')
        expect(output).toContain('`z-crm:fields:pull`')
    })

    test('an unknown name fails and suggests close names', () => {
        expect(() => renderInstructions('z-crm:function', commands, texts)).toThrow(
            /no command or group named "z-crm:function".*z-crm:functions/
        )
    })

    test('a name with nothing close points at the overview', () => {
        expect(() => renderInstructions('completely-unrelated-words', commands, texts)).toThrow(
            'Run "zoho-studio instructions" for the list of commands.'
        )
    })

    test('a part of a name is not a group', () => {
        expect(() => renderInstructions('z-crm:func', commands, texts)).toThrow(/z-crm:functions/)
    })

    test('a command without a text fails instead of printing nothing', () => {
        const withoutInit = Object.fromEntries(Object.entries(texts).filter(([key]) => key !== 'init'))

        expect(() => renderInstructions('init', commands, withoutInit)).toThrow('There are no instructions for "init"')
    })
})

describe('listNamespaces', () => {
    test('lists every prefix that groups commands', () => {
        expect(listNamespaces(commands)).toEqual(['z-crm', 'z-crm:fields', 'z-crm:functions'])
    })
})
