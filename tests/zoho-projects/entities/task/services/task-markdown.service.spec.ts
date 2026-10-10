import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { renderTask } from '@zoho-studio/zoho-projects'

import { backlog, closed, context, routeShiftNode, upgrade, upgradeNode } from './fixtures/tasks'

async function golden(name: string): Promise<string> {
    return Bun.file(join(import.meta.dir, 'fixtures', name)).text()
}

describe('renderTask', () => {
    test('renders a task without comments exactly as the golden file', async () => {
        const rendered = renderTask(upgradeNode, context(backlog, [upgradeNode]))

        expect(rendered.segments).toEqual([
            'pilot',
            'phase-22-technical-maintenance-platform-updates',
            'backlog',
            '580-upgrade-mongodb-laravel-mongodb-package.md',
        ])
        expect(rendered.content).toBe(await golden('580-upgrade-mongodb-laravel-mongodb-package.md'))
    })

    test('renders a task with comments and cross-links exactly as the golden file', async () => {
        const rendered = renderTask(routeShiftNode, context(closed, [upgradeNode, routeShiftNode]))

        expect(rendered.segments).toEqual([
            'pilot',
            'phase-22-technical-maintenance-platform-updates',
            'closed',
            '697-route-shift-windows-not-populating.md',
        ])
        expect(rendered.content).toBe(await golden('697-route-shift-windows-not-populating.md'))
    })

    test('shows _(empty)_ for a task without a description', () => {
        const rendered = renderTask({ record: { ...upgrade, description: '' }, comments: [] }, context(backlog, []))

        expect(rendered.content).toContain('## Description\n\n_(empty)_\n')
    })

    test('cuts a long name to an 80-character slug and decodes entities in the name', () => {
        const name = `Bugs &amp;amp; ${'fix '.repeat(40)}`
        const rendered = renderTask({ record: { ...upgrade, name }, comments: [] }, context(backlog, []))
        const [, , , fileName] = rendered.segments

        expect(fileName!.length).toBeLessThanOrEqual('580-'.length + 80 + '.md'.length)
        expect(fileName).toStartWith('580-bugs-fix-fix-')
        expect(rendered.content).toContain('name: Bugs & fix fix')
        expect(rendered.content).toContain('# SS5-T580: Bugs & fix fix')
    })

    test('lists a task once when it is both a dependency and a mention', () => {
        const rendered = renderTask(routeShiftNode, context(closed, [upgradeNode, routeShiftNode]))
        const crossLinks = rendered.content.split('## Cross task links\n\n')[1]!.split('\n\n## Comments')[0]!

        expect(crossLinks.split('\n').filter((line) => line.includes('580-upgrade'))).toHaveLength(1)
    })

    test('marks a mentioned task that is not in the tree as not pulled', () => {
        const rendered = renderTask(routeShiftNode, context(closed, [routeShiftNode]))

        expect(rendered.content).toContain('- task 580000 — not pulled')
        expect(rendered.content).toContain('- SS5-T999 — not pulled')
    })
})
