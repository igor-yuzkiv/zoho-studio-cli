import { describe, expect, test } from 'bun:test'

import {
    assertWorkflowActionType,
    describePullError,
    toWorkflowActionDirName,
} from '@/entities/workflow-action'

describe('assertWorkflowActionType', () => {
    test('accepts the name Zoho uses for the endpoint', () => {
        expect(assertWorkflowActionType('email_notifications')).toBe('email_notifications')
        expect(assertWorkflowActionType('webhooks')).toBe('webhooks')
    })

    test('accepts the name the local directory carries', () => {
        expect(assertWorkflowActionType('email-notifications')).toBe('email_notifications')
        expect(assertWorkflowActionType('field-updates')).toBe('field_updates')
    })

    test('rejects anything that is not an action type', () => {
        expect(() => assertWorkflowActionType('alerts')).toThrow(/--type must be one of/)
        expect(() => assertWorkflowActionType('')).toThrow(/--type must be one of/)
        expect(() => assertWorkflowActionType('../webhooks')).toThrow(/--type must be one of/)
    })
})

describe('toWorkflowActionDirName', () => {
    test('spells a two-word type in kebab-case', () => {
        expect(toWorkflowActionDirName('email_notifications')).toBe('email-notifications')
        expect(toWorkflowActionDirName('field_updates')).toBe('field-updates')
    })

    test('leaves a single-word type as it is', () => {
        expect(toWorkflowActionDirName('webhooks')).toBe('webhooks')
    })
})

describe('describePullError', () => {
    test('tells the user how to fix a missing scope, which the Zoho message does not', () => {
        const error = Object.assign(new Error('Request failed with status code 401'), {
            response: { data: { message: 'permission denied', code: 'OAUTH_SCOPE_MISMATCH' } },
        })

        expect(describePullError(error)).toContain('ZohoCRM.settings.automation_actions.READ')
        expect(describePullError(error)).toContain('zoho-studio login')
    })

    test('reports any other failure as Zoho described it', () => {
        const error = Object.assign(new Error('Request failed with status code 400'), {
            response: { data: { message: 'invalid module', code: 'INVALID_MODULE' } },
        })

        expect(describePullError(error)).toBe('invalid module (INVALID_MODULE)')
    })
})
