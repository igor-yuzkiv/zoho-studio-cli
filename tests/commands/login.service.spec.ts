import { afterEach, describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { resolveProjectSettingsPath } from '@/config'
import { login } from '@/commands/login'
import type { ProjectSettings } from '@/settings'

import { buildSettings, createTempProject, readStoredSettings, removeTempProject } from '../support/temp-project'

let projectPath: string | null = null
let server: ReturnType<typeof Bun.serve> | null = null

afterEach(async () => {
    server?.stop(true)
    server = null

    if (projectPath) {
        await removeTempProject(projectPath)
        projectPath = null
    }
})

const issuedTokens = {
    access_token: 'access',
    refresh_token: 'refresh',
    expires_in: 3600,
    api_domain: 'https://www.zohoapis.com',
    token_type: 'Bearer',
}

const deviceCodeAnswer = {
    device_code: 'device',
    user_code: 'USER-CODE',
    verification_url: 'https://accounts.zoho.com/oauth/v3/device',
    // Keeps the polling loop instant in tests; Zoho dictates 5000 in practice.
    interval: 1,
    expires_in: 300_000,
}

/** Answers the device code request, then the given poll answers in order. */
function startZoho(pollAnswers: unknown[] = [], deviceCode: unknown = deviceCodeAnswer): string {
    const answers = [...pollAnswers]

    server = Bun.serve({
        port: 0,
        fetch(request) {
            if (new URL(request.url).pathname.endsWith('/device/code')) {
                return Response.json(deviceCode)
            }

            return Response.json(answers.shift() ?? issuedTokens)
        },
    })

    return server.url.origin
}

async function startProject(
    pollAnswers: unknown[] = [],
    { auth = {}, api = {}, deviceCode = deviceCodeAnswer }: Parameters<typeof buildSettings>[0] & {
        deviceCode?: unknown
    } = {}
): Promise<void> {
    const baseUrl = startZoho(pollAnswers, deviceCode)
    projectPath = await createTempProject(buildSettings({ auth: { baseUrl, ...auth }, api }))
}

function readStoredTokens(): Promise<ProjectSettings['auth']['tokens']> {
    return readStoredSettings(projectPath!).then((settings) => settings.auth.tokens)
}

describe('login', () => {
    test('waits for approval, then stores the tokens owner-only', async () => {
        await startProject([{ error: 'authorization_pending' }, { error: 'slow_down' }, issuedTokens])

        const result = await login()

        const tokens = await readStoredTokens()
        expect(tokens.accessToken).toBe('access')
        expect(tokens.refreshToken).toBe('refresh')
        expect(tokens.accessTokenExpiresAt).toBe(result.accessTokenExpiresAt)
        expect((await stat(resolveProjectSettingsPath(projectPath!))).mode & 0o777).toBe(0o600)
        expect(result.projectPath).toBe(projectPath!)
        expect(result.apiDomainMismatch).toBeNull()
    })

    test('reports the code to enter before waiting', async () => {
        await startProject()
        const verifications: unknown[] = []

        await login({ onVerificationRequired: (verification) => verifications.push(verification) })

        expect(verifications).toEqual([
            {
                verificationUrl: 'https://accounts.zoho.com/oauth/v3/device',
                userCode: 'USER-CODE',
                expiresInMs: 300_000,
            },
        ])
    })

    test('preserves the credentials and overwrites earlier tokens', async () => {
        await startProject([], {
            auth: { tokens: { accessToken: 'old', refreshToken: 'old', accessTokenExpiresAt: 1 } },
        })

        await login()

        const settings = await readStoredSettings(projectPath!)
        expect(settings.auth.clientSecret).toBe('secret')
        expect(settings.auth.tokens.accessToken).toBe('access')
    })

    test('works from a nested folder', async () => {
        await startProject()
        const nestedPath = join(projectPath!, 'a', 'b')
        await mkdir(nestedPath, { recursive: true })
        process.chdir(nestedPath)

        expect((await login()).projectPath).toBe(projectPath!)
    })

    test('reports a data center mismatch without failing', async () => {
        await startProject([], { api: { baseUrl: 'https://www.zohoapis.eu', version: 'v8' } })

        expect((await login()).apiDomainMismatch).toEqual({
            expected: 'https://www.zohoapis.eu',
            received: 'https://www.zohoapis.com',
        })
    })

    test('fails outside a project with a hint about init', async () => {
        const emptyPath = await mkdtemp(join(tmpdir(), 'zoho-studio-empty-'))
        const previousPath = process.cwd()
        process.chdir(emptyPath)

        try {
            await expect(login()).rejects.toThrow(/zoho-studio init/)
        } finally {
            process.chdir(previousPath)
            await rm(emptyPath, { recursive: true, force: true })
        }
    })

    test('fails on empty credentials without calling Zoho', async () => {
        await startProject([], { auth: { clientId: '', clientSecret: '' } })

        await expect(login()).rejects.toThrow(/auth.clientId and auth.clientSecret/)
    })

    test('fails on empty scopes without calling Zoho', async () => {
        await startProject([], { auth: { scopes: [] } })

        await expect(login()).rejects.toThrow(/auth.scopes is empty/)
    })

    test('gives up when the device code expires before approval', async () => {
        await startProject([{ error: 'authorization_pending' }], {
            deviceCode: { ...deviceCodeAnswer, expires_in: 1 },
        })

        await expect(login()).rejects.toThrow(/expired before it was approved/)
    })

    test('leaves the stored tokens untouched when the user denies the request', async () => {
        await startProject([{ error: 'access_denied' }], {
            auth: { tokens: { accessToken: 'old', refreshToken: 'old', accessTokenExpiresAt: 1 } },
        })

        await expect(login()).rejects.toThrow(/access_denied/)

        expect((await readStoredTokens()).accessToken).toBe('old')
    })
})
