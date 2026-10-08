import { afterEach, describe, expect, test } from 'bun:test'

import { registerEmbeddedWebAssets, resolveWebAsset } from '@/commands/browser/web-assets.service'

afterEach(() => registerEmbeddedWebAssets(null))

describe('resolveWebAsset', () => {
    test('serves embedded files by their path below dist/web', async () => {
        registerEmbeddedWebAssets({ 'index.html': import.meta.path })

        expect((await resolveWebAsset('/'))?.name).toBe(import.meta.path)
        expect(await resolveWebAsset('/assets/missing.js')).toBeNull()
    })

    test('refuses a path that climbs out of the built page', async () => {
        expect(await resolveWebAsset('/../../package.json')).toBeNull()
    })
})
