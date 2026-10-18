import { describe, expect, test } from 'bun:test'

import {
    buildFunctionApiName,
    buildFunctionStub,
    functionDeployFilePath,
    functionSourceCodeFilePath,
    toFunctionNameSegment,
    validateFunctionApiName,
    validateFunctionDescription,
    validateFunctionName,
} from '@zoho-studio/zoho-crm/function'

const naming = {
    enabled: true,
    vendor: 'oz',
    categoryPrefixes: { Automation: 'wf', Standalone: 'sa' },
}

describe('toFunctionNameSegment', () => {
    test('turns free text into lower snake case without gluing words', () => {
        expect(toFunctionNameSegment('Refresh Pricing')).toBe('refresh_pricing')
        expect(toFunctionNameSegment('  open-wizard  now ')).toBe('open_wizard_now')
        expect(toFunctionNameSegment('openwizard')).toBe('openwizard')
    })
})

describe('buildFunctionApiName', () => {
    test('joins vendor, category prefix, module and purpose', () => {
        expect(
            buildFunctionApiName(naming, { category: 'Automation', module: 'Programs', what: 'refresh pricing' })
        ).toBe('oz_wf_programs_refresh_pricing')
    })

    test('leaves out the module segment when there is no module', () => {
        expect(buildFunctionApiName(naming, { category: 'Standalone', what: 'ping' })).toBe('oz_sa_ping')
    })

    test('leaves out the vendor segment when the vendor is empty', () => {
        expect(buildFunctionApiName({ ...naming, vendor: '' }, { category: 'Standalone', what: 'ping' })).toBe(
            'sa_ping'
        )
    })

    test('falls back to the category itself when it has no prefix', () => {
        expect(buildFunctionApiName(naming, { category: 'Related List', what: 'contacts' })).toBe(
            'oz_related_list_contacts'
        )
    })
})

describe('function field validation', () => {
    test('accepts a display name with spaces, hyphens and underscores', () => {
        expect(validateFunctionName('Refresh Pricing-v2_x')).toBeNull()
    })

    test('rejects a display name that is too short, too long or starts with a digit', () => {
        expect(validateFunctionName('ab')).not.toBeNull()
        expect(validateFunctionName('a'.repeat(101))).not.toBeNull()
        expect(validateFunctionName('1st function')).not.toBeNull()
    })

    test('rejects a space or another symbol in the API name', () => {
        expect(validateFunctionApiName('oz_sa_ping')).toBeNull()
        expect(validateFunctionApiName('oz sa ping')).not.toBeNull()
        expect(validateFunctionApiName('oz.sa.ping')).not.toBeNull()
    })

    test('limits the description to 3000 characters', () => {
        expect(validateFunctionDescription('a'.repeat(3000))).toBeNull()
        expect(validateFunctionDescription('a'.repeat(3001))).not.toBeNull()
    })
})

describe('buildFunctionStub', () => {
    test('declares the function from its category and display name', () => {
        expect(buildFunctionStub({ name: 'Refresh Pricing', category: 'Automation', returnType: 'void' })).toBe(
            'void automation.refresh_pricing()\n{\n}\n'
        )
    })

    test('returns a value of the declared type so the stub compiles as it is', () => {
        expect(buildFunctionStub({ name: 'oz_sa_ping', category: 'Standalone', returnType: 'string' })).toBe(
            'string standalone.oz_sa_ping()\n{\n\treturn "";\n}\n'
        )
        expect(buildFunctionStub({ name: 'check-name', category: 'Validation Rule', returnType: 'map' })).toBe(
            'map validation_rule.check_name()\n{\n\treturn Map();\n}\n'
        )
    })
})

describe('function source paths', () => {
    test('names both files after the API name inside the function folder', () => {
        expect(functionSourceCodeFilePath('oz_sa_ping')).toEqual([
            'zoho-crm',
            'functions',
            'oz_sa_ping',
            'oz_sa_ping.deluge',
        ])
        expect(functionDeployFilePath('oz_sa_ping')).toEqual([
            'zoho-crm',
            'functions',
            'oz_sa_ping',
            'oz_sa_ping.deploy.json',
        ])
    })
})
