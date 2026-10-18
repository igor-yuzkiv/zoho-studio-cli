import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { scaffoldFunctionSource } from '@zoho-studio/zoho-crm/function'

let projectPath: string

beforeEach(async () => {
    projectPath = await mkdtemp(join(tmpdir(), 'zoho-studio-scaffold-'))
})

afterEach(async () => {
    await rm(projectPath, { recursive: true, force: true })
})

const functionsPath = () => join(projectPath, 'src', 'zoho-crm', 'functions')

const pingFunction = {
    name: 'oz_sa_ping',
    api_name: 'oz_sa_ping',
    description: 'Answers pong',
    category: 'Standalone' as const,
    returnType: 'string',
}

describe('scaffoldFunctionSource', () => {
    test('does not mistake an empty folder for pulled functions', async () => {
        await mkdir(join(functionsPath(), 'left_empty'), { recursive: true })

        await scaffoldFunctionSource(projectPath, pingFunction)

        expect(await Bun.file(join(functionsPath(), 'oz_sa_ping', 'oz_sa_ping.deluge')).exists()).toBe(true)
    })

    test('writes the Deluge stub and a deploy file that has never been deployed', async () => {
        await scaffoldFunctionSource(projectPath, pingFunction)

        const folder = join(functionsPath(), 'oz_sa_ping')
        expect(await Bun.file(join(folder, 'oz_sa_ping.deluge')).text()).toBe(
            'string standalone.oz_sa_ping()\n{\n\treturn "";\n}\n'
        )
        expect(await Bun.file(join(folder, 'oz_sa_ping.deploy.json')).json()).toEqual({
            id: null,
            name: 'oz_sa_ping',
            api_name: 'oz_sa_ping',
            description: 'Answers pong',
            runtime: 'Deluge 1.0',
            category: 'Standalone',
            deployments: [],
        })
    })

    test('refuses a function whose folder already exists', async () => {
        await scaffoldFunctionSource(projectPath, pingFunction)

        await expect(scaffoldFunctionSource(projectPath, pingFunction)).rejects.toThrow(/already exists/)
    })

    test('refuses an API name that differs from an existing one only in case', async () => {
        await scaffoldFunctionSource(projectPath, pingFunction)

        await expect(
            scaffoldFunctionSource(projectPath, { ...pingFunction, name: 'Oz_Sa_Ping', api_name: 'Oz_Sa_Ping' })
        ).rejects.toThrow(/already exists/)
    })

    test('refuses a return type the category does not allow', async () => {
        await expect(scaffoldFunctionSource(projectPath, { ...pingFunction, returnType: 'void' })).rejects.toThrow(
            /return type/
        )
    })

    test('points a project still keeping snapshots in src to the move', async () => {
        await mkdir(join(functionsPath(), 'old_snapshot'), { recursive: true })
        await Bun.write(join(functionsPath(), 'old_snapshot', 'Old Snapshot.deluge'), '')

        await expect(scaffoldFunctionSource(projectPath, pingFunction)).rejects.toThrow(
            /mv src\/zoho-crm data\/zoho-crm/
        )
        expect(await Bun.file(join(functionsPath(), 'oz_sa_ping', 'oz_sa_ping.deluge')).exists()).toBe(false)
    })
})
