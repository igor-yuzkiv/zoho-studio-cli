import { describe, expect, test } from 'bun:test'

import { ProjectDefaultConfig } from '@/config/default.config'

// Placeholder until the first real suite lands: guards the two things a fresh
// checkout can silently get wrong — the runner picking up tests/**/*.spec.ts
// and the "@/" alias resolving from outside src/.
describe('test harness', () => {
    test('resolves the "@/" alias from the tests folder', () => {
        expect(ProjectDefaultConfig.api.version).toBe('v8')
    })
})
