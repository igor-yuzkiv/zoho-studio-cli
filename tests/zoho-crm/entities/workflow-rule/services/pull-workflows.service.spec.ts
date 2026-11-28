import { afterEach, describe, expect, test } from 'bun:test'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { silentPullProgress, writeArtifactJson } from '@zoho-studio/core'
import { pullWorkflows } from '@zoho-studio/zoho-crm/workflow-rule'

import { startCrmStub, type CrmStub } from '../../../../support/crm-stub'

let crm: CrmStub | null = null

afterEach(async () => {
    await crm?.stop()
    crm = null
})

const leadsRule = { id: '1', name: 'Leads Alert', module: { api_name: 'Leads' } }

function answerWithLeadsRule(request: Request): Response {
    const { pathname } = new URL(request.url)

    return Response.json({ workflow_rules: [leadsRule], ...(pathname.endsWith('/1') ? {} : { info: {} }) })
}

describe('pullWorkflows', () => {
    test('with --module moves only that module’s rules Zoho no longer has', async () => {
        crm = await startCrmStub(answerWithLeadsRule)
        await writeArtifactJson(crm.projectPath, ['zoho-crm', 'workflows', 'Old Leads Rule.json'], {
            id: '9',
            name: 'Old Leads Rule',
            module: { api_name: 'Leads' },
        })
        await writeArtifactJson(crm.projectPath, ['zoho-crm', 'workflows', 'Deals Rule.json'], {
            id: '5',
            name: 'Deals Rule',
            module: { api_name: 'Deals' },
        })

        const result = await pullWorkflows({ module: 'Leads' }, silentPullProgress)

        expect(result.removedPaths).toHaveLength(1)
        expect(result.removedPaths[0]).toMatch(/zoho-crm\/workflows\/Old Leads Rule\.json$/)
        expect((await readdir(join(crm.projectPath, 'data/zoho-crm/workflows'))).sort()).toEqual([
            'Deals Rule.json',
            'Leads Alert.json',
        ])
    })
})
