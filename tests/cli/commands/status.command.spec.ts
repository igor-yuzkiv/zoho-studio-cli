import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'

import { startCrmStub, type CrmStub } from '../../support/crm-stub'

const { statusCommand } = await import('@/commands/zoho-crm/status')

let crm: CrmStub
let printed: string[]

beforeEach(() => {
    printed = []
    spyOn(console, 'log').mockImplementation((line: unknown) => printed.push(String(line)))
})

afterEach(async () => {
    await crm.stop()
})

describe('z-crm:status', () => {
    test('names the organization with its type, domain and data center', async () => {
        crm = await startCrmStub(() =>
            Response.json({
                org: [{ company_name: 'Acme', id: '7000', type: 'sandbox', domain_name: 'acme', primary_email: 'a@acme.test' }],
            })
        )

        await statusCommand.parseAsync([], { from: 'user' })

        expect(printed).toEqual([
            'Organization: Acme',
            '  id: 7000',
            '  type: sandbox',
            '  domain: acme',
            `  data center: ${crm.requestedUrls[0]!.origin}`,
            '  primary email: a@acme.test',
        ])
    })
})
