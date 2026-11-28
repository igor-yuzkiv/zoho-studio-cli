import { afterEach, describe, expect, test } from 'bun:test'
import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

import { silentPullProgress, writeArtifactJson } from '@zoho-studio/core'
import { pullModules } from '@zoho-studio/zoho-crm/module'

import { startCrmStub, type CrmStub } from '../../../../support/crm-stub'

let crm: CrmStub | null = null

afterEach(async () => {
    await crm?.stop()
    crm = null
})

const modulesAnswer = (...apiNames: string[]) => () =>
    Response.json({ modules: apiNames.map((api_name) => ({ api_name, id: api_name })) })

describe('pullModules', () => {
    test('keeps the fields and layouts other pulls wrote into a module folder', async () => {
        crm = await startCrmStub(modulesAnswer('Leads'))
        await writeArtifactJson(crm.projectPath, ['zoho-crm', 'modules', 'Leads', 'fields', 'Email.json'], {})
        await writeArtifactJson(crm.projectPath, ['zoho-crm', 'modules', 'Leads', 'layouts', 'Standard.json'], {})

        const result = await pullModules(silentPullProgress)

        expect(result.removedPaths).toEqual([])
        expect((await readdir(join(crm.projectPath, 'data/zoho-crm/modules/Leads'))).sort()).toEqual([
            'Leads.metadata.json',
            'fields',
            'layouts',
        ])
    })

    test('moves the whole folder of a module Zoho no longer has into data/.removed', async () => {
        crm = await startCrmStub(modulesAnswer('Leads'))
        await writeArtifactJson(crm.projectPath, ['zoho-crm', 'modules', 'Gone', 'Gone.metadata.json'], {})
        await writeArtifactJson(crm.projectPath, ['zoho-crm', 'modules', 'Gone', 'fields', 'F.json'], {})

        const result = await pullModules(silentPullProgress)

        expect(result.removedPaths.map((path) => path.split('/').slice(2).join('/')).sort()).toEqual([
            'zoho-crm/modules/Gone/Gone.metadata.json',
            'zoho-crm/modules/Gone/fields/F.json',
        ])
        expect(await readdir(join(crm.projectPath, 'data/zoho-crm/modules'))).toEqual(['Leads'])
        expect(result.summary.at(-1)).toMatch(/^Moved 2 removed files to data\/\.removed\//)
    })

    test('keeps a module folder whose API name changed only in case on a case-insensitive disk', async () => {
        crm = await startCrmStub(modulesAnswer('leads'))
        await writeArtifactJson(crm.projectPath, ['zoho-crm', 'modules', 'Leads', 'fields', 'Email.json'], {})
        const modulesPath = join(crm.projectPath, 'data/zoho-crm/modules')
        const insensitive = await Bun.file(join(modulesPath, 'leads', 'fields', 'Email.json')).exists()

        const result = await pullModules(silentPullProgress)

        if (insensitive) {
            expect(result.removedPaths).toEqual([])
            expect(await Bun.file(join(modulesPath, 'leads', 'fields', 'Email.json')).exists()).toBe(true)
        } else {
            expect(result.removedPaths.map((path) => path.split('/').slice(2).join('/'))).toEqual([
                'zoho-crm/modules/Leads/fields/Email.json',
            ])
        }
    })
})
