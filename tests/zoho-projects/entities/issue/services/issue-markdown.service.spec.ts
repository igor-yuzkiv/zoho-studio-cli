import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { renderIssue } from '@zoho-studio/zoho-projects'

import { brokenExport, brokenExportNode, context, timeout, timeoutNode, upgradeTask } from './fixtures/issues'

async function golden(name: string): Promise<string> {
    return Bun.file(join(import.meta.dir, 'fixtures', name)).text()
}

describe('renderIssue', () => {
    test('renders an issue without comments exactly as the golden file', async () => {
        const rendered = renderIssue(timeoutNode, context([timeoutNode]))

        expect(rendered.segments).toEqual(['issues', 'open', '51-login-timeout-on-the-page.md'])
        expect(rendered.content).toBe(await golden('51-login-timeout-on-the-page.md'))
    })

    test('renders an issue with comments and cross links to issues and tasks exactly as the golden file', async () => {
        const rendered = renderIssue(brokenExportNode, context([timeoutNode, brokenExportNode], [upgradeTask]))

        expect(rendered.segments).toEqual(['issues', 'closed', '52-broken-export.md'])
        expect(rendered.content).toBe(await golden('52-broken-export.md'))
    })

    test('names the file after the id when the issue has no prefix', () => {
        const rendered = renderIssue({ record: { ...timeout, prefix: undefined }, comments: [] }, context([]))

        expect(rendered.segments[2]).toBe('510000-login-timeout-on-the-page.md')
        expect(rendered.content).toContain('# Login timeout on the & page')
    })

    test('shows _(empty)_ for an issue without a description and _(none)_ without cross links', () => {
        const rendered = renderIssue({ record: { ...timeout, description: undefined }, comments: [] }, context([]))

        expect(rendered.content).toContain('## Description\n\n_(empty)_\n')
        expect(rendered.content).toContain('## Cross links\n\n_(none)_\n')
    })

    test('marks a mentioned issue that is not in raw as not pulled and links a task that is', () => {
        const rendered = renderIssue(brokenExportNode, context([brokenExportNode], [upgradeTask]))

        expect(rendered.content).toContain('- QA7-I51 — not pulled')
        expect(rendered.content).toContain('- [[580-upgrade-the-export-package]] — QA7-T580 Upgrade the export package (Backlog)')
        expect(rendered.content).toContain('related_issues: []')
        expect(rendered.content).toContain('related_tasks:\n- 580-upgrade-the-export-package')
    })

    test('writes a null assignee for the Unassigned User placeholder', () => {
        const rendered = renderIssue(timeoutNode, context([]))
        const withAssignee = renderIssue({ record: brokenExport, comments: [] }, context([]))

        expect(rendered.content).toContain('assignee: null')
        expect(withAssignee.content).toContain('assignee:\n  name: Sam\n  email: sam@example.test')
    })
})
