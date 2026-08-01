import { describe, expect, test } from 'bun:test'

import { describeRequestError, resolveWebhookFileName, sortWebhooks } from '@/commands/webhooks/pull-webhooks.command'

describe('resolveWebhookFileName', () => {
    test('names the file after the webhook', () => {
        expect(resolveWebhookFileName('SRV.Programs.Delete', '1', new Set())).toBe('SRV.Programs.Delete.json')
    })

    test('keeps the file name a single path segment', () => {
        expect(resolveWebhookFileName('Deals/Won', '1', new Set())).toBe('Deals_Won.json')
    })

    test('adds the webhook id when the name is already taken', () => {
        expect(resolveWebhookFileName('Upsert', '2', new Set(['Upsert.json']))).toBe('Upsert.2.json')
    })

    test('falls back to the webhook id when the name leaves no usable file name', () => {
        expect(resolveWebhookFileName('..', '7', new Set())).toBe('7.json')
        expect(resolveWebhookFileName('   ', '7', new Set())).toBe('7.json')
    })
})

describe('sortWebhooks', () => {
    test('orders by module, then name, then id so collisions resolve the same way each run', () => {
        const webhooks = [
            { id: '9', name: 'Upsert', module: { api_name: 'Leads' } },
            { id: '3', name: 'Upsert', module: { api_name: 'Deals' } },
            { id: '1', name: 'Alert', module: { api_name: 'Deals' } },
        ]

        expect(sortWebhooks(webhooks).map((webhook) => webhook.id)).toEqual(['1', '3', '9'])
    })

    test('orders a webhook without a module first', () => {
        const webhooks = [
            { id: '2', name: 'B', module: { api_name: 'Deals' } },
            { id: '1', name: 'A' },
        ]

        expect(sortWebhooks(webhooks).map((webhook) => webhook.id)).toEqual(['1', '2'])
    })

    test('leaves the given list untouched', () => {
        const webhooks = [
            { id: '2', name: 'B', module: { api_name: 'Deals' } },
            { id: '1', name: 'A', module: { api_name: 'Deals' } },
        ]

        sortWebhooks(webhooks)

        expect(webhooks.map((webhook) => webhook.id)).toEqual(['2', '1'])
    })
})

describe('describeRequestError', () => {
    test('prefers what Zoho put in the response body over the HTTP status', () => {
        const error = Object.assign(new Error('Request failed with status code 401'), {
            response: { data: { message: 'permission denied', code: 'OAUTH_SCOPE_MISMATCH' } },
        })

        expect(describeRequestError(error)).toBe('permission denied (OAUTH_SCOPE_MISMATCH)')
    })

    test('falls back to the error message when there is no Zoho payload', () => {
        expect(describeRequestError(new Error('socket hang up'))).toBe('socket hang up')
        expect(describeRequestError('broken')).toBe('broken')
    })
})
