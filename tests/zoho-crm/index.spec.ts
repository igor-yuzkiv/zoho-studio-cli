import { describe, expect, test } from 'bun:test'

import packageJson from '../../packages/zoho-crm/package.json'

import * as root from '@zoho-studio/zoho-crm'

const subpaths = Object.keys(packageJson.exports).filter((subpath) => subpath !== '.')

describe('@zoho-studio/zoho-crm', () => {
    // `export *` silently drops a name two modules both export, so a clash would vanish from the root.
    test('exposes everything every subpath exports, from the root', async () => {
        for (const subpath of subpaths) {
            const module = await import(`@zoho-studio/zoho-crm/${subpath.slice(2)}`)

            for (const name of Object.keys(module)) {
                expect({ subpath, name, exported: root[name as keyof typeof root] === module[name] }).toEqual({
                    subpath,
                    name,
                    exported: true,
                })
            }
        }
    })
})
