import { describe, expect, test } from 'bun:test'

import { findProfileByName } from '@zoho-studio/zoho-crm/profile'

const profiles = [
    { id: '1', api_name: 'Administrator', name: 'Administrator' },
    { id: '3', api_name: 'Team_User', name: 'Team User' },
]

describe('findProfileByName', () => {
    test('finds a profile by its display name', () => {
        expect(findProfileByName(profiles, 'Team User').id).toBe('3')
    })

    test('falls back to the API name', () => {
        expect(findProfileByName(profiles, 'Team_User').id).toBe('3')
    })

    test('names the unknown profile and the known ones', () => {
        expect(() => findProfileByName(profiles, 'Sales')).toThrow(/"Sales".*Administrator, Team User/)
    })
})
