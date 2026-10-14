import { afterEach, describe, expect, test } from 'bun:test'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { silentPullProgress } from '@zoho-studio/core'
import { pullLayouts } from '@zoho-studio/zoho-crm/layout'

import { startCrmStub, type CrmStub } from '../../../../support/crm-stub'

let crm: CrmStub | null = null

afterEach(async () => {
    await crm?.stop()
    crm = null
})

const modulesPath = (projectPath: string) => join(projectPath, 'src', 'zoho-crm', 'modules')

async function addLocalModules(projectPath: string, names: string[]) {
    for (const name of names) {
        await mkdir(join(modulesPath(projectPath), name), { recursive: true })
    }
}

function layoutsOf(module: string) {
    return [
        { id: `${module}-1`, api_name: 'Standard__s', sections: [{ api_name: 'Information__s', fields: [] }] },
        { id: `${module}-2`, api_name: 'Standard__s', sections: [] },
    ]
}

describe('pullLayouts', () => {
    test('saves every layout of every local module, one file per layout', async () => {
        crm = await startCrmStub((request) =>
            Response.json({ layouts: layoutsOf(new URL(request.url).searchParams.get('module')!) })
        )
        await addLocalModules(crm.projectPath, ['Deals', 'Leads'])

        const result = await pullLayouts({}, silentPullProgress)

        expect(result.failedCount).toBe(0)
        expect(result.summary).toContain('Layouts saved: 4')
        expect(crm.requestedUrls.map((url) => url.searchParams.get('module'))).toEqual(['Deals', 'Leads'])

        const dealsLayouts = join(modulesPath(crm.projectPath), 'Deals', 'layouts')
        expect((await readdir(dealsLayouts)).sort()).toEqual(['Standard__s.Deals-2.json', 'Standard__s.json'])
        expect(JSON.parse(await readFile(join(dealsLayouts, 'Standard__s.json'), 'utf8')).id).toBe('Deals-1')
    })

    test('pulls only the requested module', async () => {
        crm = await startCrmStub(() => Response.json({ layouts: layoutsOf('Leads') }))
        await addLocalModules(crm.projectPath, ['Deals', 'Leads'])

        await pullLayouts({ module: 'Leads' }, silentPullProgress)

        expect(crm.requestedUrls.map((url) => url.searchParams.get('module'))).toEqual(['Leads'])
    })

    test('refuses a module that has not been pulled locally', async () => {
        crm = await startCrmStub(() => Response.json({ layouts: [] }))
        await addLocalModules(crm.projectPath, ['Deals'])

        await expect(pullLayouts({ module: 'Leads' }, silentPullProgress)).rejects.toThrow(/z-crm:modules:pull/)
        expect(crm.requestedUrls).toHaveLength(0)
    })

    test('keeps the previous layouts of a module whose request fails and carries on', async () => {
        crm = await startCrmStub((request) =>
            new URL(request.url).searchParams.get('module') === 'Deals'
                ? Response.json({ code: 'INTERNAL_ERROR' }, { status: 500 })
                : Response.json({ layouts: layoutsOf('Leads') })
        )
        await addLocalModules(crm.projectPath, ['Deals', 'Leads'])
        const previousLayout = join(modulesPath(crm.projectPath), 'Deals', 'layouts', 'Old__s.json')
        await mkdir(join(previousLayout, '..'), { recursive: true })
        await writeFile(previousLayout, '{}')

        const result = await pullLayouts({}, silentPullProgress)

        expect(result.failedCount).toBe(1)
        expect(result.summary.some((line) => line.startsWith('  - Deals:'))).toBe(true)
        expect(await readFile(previousLayout, 'utf8')).toBe('{}')
        expect(await readdir(join(modulesPath(crm.projectPath), 'Leads', 'layouts'))).toHaveLength(2)
    })
})
