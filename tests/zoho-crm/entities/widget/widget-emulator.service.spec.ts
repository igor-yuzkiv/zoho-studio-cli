import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { startWidgetEmulator, type WidgetEmulator } from '@zoho-studio/zoho-crm/widget'

import { createTempProject, removeTempProject } from '../../../support/temp-project'

let projectPath: string
let emulator: WidgetEmulator

async function write(relativePath: string, content: unknown) {
    const filePath = join(projectPath, relativePath)
    await mkdir(join(filePath, '..'), { recursive: true })
    await writeFile(filePath, typeof content === 'string' ? content : JSON.stringify(content))
}

beforeEach(async () => {
    projectPath = await createTempProject()
    await write('widgets/card/widget.json', { url: 'http://127.0.0.1:5050/app.html', defaultScenario: 'default' })
    await write('widgets/card/fixtures/Leads.json', [{ id: '1', Last_Name: 'Doe' }])
    // A scenario outside a linked project cannot import the package; a plain object is what it exports anyway.
    await write('widgets/card/scenarios/default.ts', `export default { pageLoad: { Entity: 'Leads', EntityId: '1' } }`)
    await write(
        'widgets/card/scenarios/saves.ts',
        `export default {
            mocks: {
                'API.updateRecord': ({ APIData }) => ({ data: [{ code: 'SUCCESS', details: { id: APIData.id } }] }),
                'API.deleteRecord': () => { throw { code: 'NO_PERMISSION' } },
            },
        }`
    )
    await write('data/zoho-crm/modules/Leads/fields/Last_Name.json', { api_name: 'Last_Name' })
    await write('data/zoho-crm/modules/Leads/fields/Email.json', { api_name: 'Email' })
    emulator = startWidgetEmulator({ projectPath })
})

afterEach(async () => {
    await emulator.stop()
    await removeTempProject(projectPath)
})

async function sdk(sessionId: string, data: Record<string, unknown>) {
    const response = await fetch(`${emulator.origin}/api/sessions/${sessionId}/sdk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: 'CRM_EVENT', data: { ...data, sdkVersion: '1.5' } }),
    })

    return (await response.json()) as { ok: boolean; data: unknown }
}

describe('widget emulator', () => {
    test('opens the default scenario and serves a harness that names itself as serviceOrigin', async () => {
        const session = await emulator.createSession('card')
        const page = await (await fetch(session.url)).text()

        expect(session.scenario).toBe('default')
        expect(page).toContain(`serviceOrigin=${encodeURIComponent(emulator.origin)}`)
        expect(page).toContain('"pageLoad":{"Entity":"Leads","EntityId":"1"}')
    })

    test('answers metadata and fixtures by default', async () => {
        const { id } = await emulator.createSession('card')

        expect(await sdk(id, { category: 'META', type: 'FIELD_LIST', Entity: 'Leads' })).toEqual({
            ok: true,
            data: { fields: [{ api_name: 'Email' }, { api_name: 'Last_Name' }] },
            entry: expect.anything(),
        } as never)
        expect((await sdk(id, { category: 'READ', APIData: { Entity: 'Leads', RecordID: '1' } })).data).toEqual({
            data: [{ id: '1', Last_Name: 'Doe' }],
        })
    })

    test('lets a scenario mock resolve or reject a call', async () => {
        const { id } = await emulator.createSession('card', 'saves')

        expect(
            (await sdk(id, { category: 'UPDATE', type: 'RECORD', Entity: 'Leads', APIData: { id: '1' } })).data
        ).toEqual({
            data: [{ code: 'SUCCESS', details: { id: '1' } }],
        })
        expect(await sdk(id, { category: 'DELETE', type: 'RECORD', Entity: 'Leads', RecordID: '1' })).toMatchObject({
            ok: false,
            data: { code: 'NO_PERMISSION' },
        })
    })

    test('tells a missing mock apart from an unsupported method', async () => {
        const { id } = await emulator.createSession('card')

        expect(await sdk(id, { category: 'SEARCH', Entity: 'Leads' })).toMatchObject({
            ok: false,
            data: { code: 'ZOHO_STUDIO_NO_MOCK', message: expect.stringContaining('No mock for API.searchRecord') },
        })
        expect(await sdk(id, { category: 'FUNCTIONS_EXECUTE', customFunctionName: 'f' })).toMatchObject({
            ok: false,
            data: {
                code: 'ZOHO_STUDIO_UNSUPPORTED',
                message: expect.stringContaining('FUNCTIONS.execute is not supported'),
            },
        })
    })

    test('keeps a call log per session', async () => {
        const first = await emulator.createSession('card')
        const second = await emulator.createSession('card')
        await sdk(first.id, { category: 'CONFIG', type: 'CURRENT_USER' })

        const logOf = async (id: string) => (await fetch(`${emulator.origin}/api/sessions/${id}/calls`)).json()

        expect(await logOf(first.id)).toMatchObject([{ method: 'CONFIG.getCurrentUser', ok: false }])
        expect(await logOf(second.id)).toEqual([])
    })

    test('refuses requests from another origin, such as the widget itself', async () => {
        const response = await fetch(`${emulator.origin}/api/widgets`, { headers: { Origin: 'http://127.0.0.1:5050' } })

        expect(response.status).toBe(403)
    })
})
