import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { readLocalModuleFields } from '@zoho-studio/zoho-crm/field'
import { readLocalModuleLayouts } from '@zoho-studio/zoho-crm/layout'
import { readLocalModuleMetadata } from '@zoho-studio/zoho-crm/module'

import { createTempProject, removeTempProject } from '../../../support/temp-project'

let projectPath: string

beforeEach(async () => {
    projectPath = await createTempProject()
})

afterEach(async () => {
    await removeTempProject(projectPath)
})

const modulePath = (...segments: string[]) => join(projectPath, 'data/zoho-crm/modules/Leads', ...segments)

describe('local module metadata', () => {
    test('reads the module, its fields and its layouts as pulled', async () => {
        await Bun.write(modulePath('Leads.metadata.json'), JSON.stringify({ api_name: 'Leads' }))
        await Bun.write(modulePath('fields/Last_Name.json'), JSON.stringify({ api_name: 'Last_Name' }))
        await Bun.write(modulePath('fields/Email.json'), JSON.stringify({ api_name: 'Email' }))
        await Bun.write(modulePath('layouts/Standard.json'), JSON.stringify({ id: '7', api_name: 'Standard' }))

        expect(await readLocalModuleMetadata(projectPath, 'Leads')).toEqual({ api_name: 'Leads' } as never)
        expect(await readLocalModuleFields(projectPath, 'Leads')).toEqual([
            { api_name: 'Email' },
            { api_name: 'Last_Name' },
        ] as never)
        expect(await readLocalModuleLayouts(projectPath, 'Leads')).toEqual([{ id: '7', api_name: 'Standard' }] as never)
    })

    test('points to the pull that is missing', async () => {
        await expect(readLocalModuleMetadata(projectPath, 'Leads')).rejects.toThrow('z-crm:modules:pull')
        await expect(readLocalModuleFields(projectPath, 'Leads')).rejects.toThrow('z-crm:fields:pull --module=Leads')
        await expect(readLocalModuleLayouts(projectPath, 'Leads')).rejects.toThrow('z-crm:layouts:pull --module=Leads')
    })
})
